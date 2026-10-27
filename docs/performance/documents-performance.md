# Documents API Performance Report

**Project:** Distributed Collaboration Platform\
**Component:** Authenticated Documents API and PostgreSQL query
performance\
**Report status:** Work-in-progress snapshot\
**Test environment:** Local development environment on Windows;
PostgreSQL and Node.js application\
**Purpose:** Record all load and database performance checks completed
so far before committing and pushing the work.

> These measurements are local development results, not production
> capacity guarantees. Results depend on hardware, cache state, database
> contents, and test configuration.

## 1. Summary

  -----------------------------------------------------------------------
  Test              Dataset / load    Result            Interpretation
  ----------------- ----------------- ----------------- -----------------
  Artillery         450 virtual users 0 failed          Successful local
  authenticated     completed; 2,250  requests;         functional/load
  CRUD flow         requests          aggregate request run
                                      rate about 70     
                                      req/s             

  Initial           3 documents in    Sequential scan;  Sequential scan
  document-list     table; queried    0.060 ms          is expected for a
  query             owner had no      execution         tiny table
                    matching                            
                    documents                           

  Document-list     10,003 documents  Index Scan; 1.024 Composite index
  query after       for owner `297`   ms execution      used for owner
  single-owner seed                                     filtering and
                                                        ordering

  Document-list     10,000 test       Bitmap Index      Index used;
  query after       documents         Scan + Bitmap     PostgreSQL chose
  multi-owner seed  distributed       Heap Scan + Sort; bitmap retrieval
                    across 100 users; 0.140 ms          and then sorted
                    queried owner `1` execution         matching rows
                    matched 100 rows                    
  -----------------------------------------------------------------------

## 2. Artillery HTTP load test

The Artillery configuration used was
`tests/performance/artillery-documents.yml`. It exercised the
authenticated document CRUD flow using the `TEST_ACCESS_TOKEN`
environment variable.

### Load profile

-   Phase 1: 30 seconds at an arrival rate of 5 requests/second.
-   Phase 2: 30 seconds at an arrival rate of 10 requests/second.
-   Completed virtual users: **450**.
-   Total HTTP requests: **2,250**.
-   Aggregate request rate reported by the run: approximately **70
    requests/second**.

### HTTP status breakdown

  HTTP status         Count Typical operation
  ----------------- ------- -----------------------------
  200                 1,350 Successful reads/updates
  201                   450 Successful creates
  204                   450 Successful deletes
  Failed requests         0 No failed requests reported

### Latency

  Metric                     Result
  ----------------------- ---------
  Mean request latency       1.2 ms
  Median (p50)                 1 ms
  p95                          3 ms
  p99                          3 ms
  Maximum                     30 ms
  Mean session length       10.4 ms
  Median session length      9.7 ms
  p95 session length        13.1 ms
  p99 session length        27.9 ms

**Interpretation:** The configured local CRUD flow completed without
failed requests and reported low latency in this run. This is not
evidence that the application can sustain the same latency or throughput
in production. The test was local, and workload size, payload sizes,
hardware, cache state, database contention, and the client machine all
affect the result.

## 3. PostgreSQL query-plan tests

The document-list query under test was:

``` sql
SELECT id, owner_id, title, content, created_at, updated_at
FROM documents
WHERE owner_id = $1
ORDER BY updated_at DESC, id DESC;
```

The existing composite index is:

``` sql
(owner_id, updated_at DESC, id DESC)
```

Index name reported by PostgreSQL:

``` text
documents_owner_updated_id_idx
```

### Test A --- Tiny initial dataset

-   Dataset: 3 documents total.
-   Query owner: `owner_id = 1`, which had no matching documents at the
    time.
-   Plan: `Seq Scan` followed by `Sort`.
-   Rows removed by filter: 3.
-   Execution time: **0.060 ms**.
-   Planning time: 1.651 ms.

**Interpretation:** A sequential scan is reasonable for a table
containing only three rows. This plan alone did not indicate a missing
index or an optimization problem.

### Test B --- 10,003 documents for one owner

-   Dataset: 10,003 documents for `owner_id = 297` during the test.
-   Command: `ANALYZE documents` followed by
    `EXPLAIN (ANALYZE, BUFFERS)`.
-   Plan: `Index Scan using documents_owner_updated_id_idx`.
-   Rows returned: 10,003.
-   Shared buffer hits: 236.
-   Execution time: **1.024 ms**.
-   Planning time: 0.121 ms.

**Interpretation:** PostgreSQL used the composite index. The plan did
not contain a separate `Sort` node, consistent with the index supporting
the requested ordering. Because all rows belonged to the same owner,
this test was primarily a volume/order test, not a selective multi-owner
lookup test.

### Test C --- 10,000 documents distributed across 100 users

-   Dataset: 10,000 temporary documents distributed across 100 existing
    users, with the `PERF_TEST_MULTI_` title prefix.
-   Query owner: `owner_id = 1`.
-   Rows returned: 100.
-   Plan:
    -   `Bitmap Index Scan on documents_owner_updated_id_idx`
    -   `Bitmap Heap Scan on documents`
    -   `Sort` on `updated_at DESC, id DESC`
-   Index scan rows: 100.
-   Index scan shared buffer hits: 5.
-   Heap scan exact blocks: 100.
-   Total shared buffer hits: 105.
-   Execution time: **0.140 ms**.
-   Planning time: 0.141 ms.
-   Sort method: quicksort; memory: 35 kB.

**Interpretation:** The composite index was used to find matching rows.
PostgreSQL then chose a bitmap heap scan and an explicit sort. This is a
valid planner choice; a small sort is not automatically a performance
issue. Do not change or add indexes solely to eliminate this sort
without benchmarking representative workloads.

## 4. Database integrity and index observations

-   Foreign key verified: `documents_owner_id_fkey`.
-   Definition:
    `FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE`.
-   `ANALYZE documents` was run before the multi-owner query-plan test.
-   The owner-specific listing query uses the existing composite index.
-   No additional index has been added during these tests.
-   No pagination implementation has been added yet. The document-list
    controller currently passes the authenticated owner ID to the
    service; pagination work is planned but not part of the measurements
    above.

## 5. Test-data cleanup status

Temporary test data was created in two stages:

1.  **Single-owner seed:** 10,000 rows were added for owner `297`,
    producing 10,003 rows during the query-plan test. The user later
    confirmed this test data was deleted.
2.  **Multi-owner seed:** 10,000 rows were added across 100 users using
    titles beginning with `PERF_TEST_MULTI_`. The query-plan test was
    run against this dataset.

**Important:** The multi-owner seed was not yet confirmed deleted in the
conversation at the time this report was prepared. Before
committing/pushing or running other tests, verify and remove only these
test rows:

``` sql
DELETE FROM documents
WHERE title LIKE 'PERF!_TEST!_MULTI!_%' ESCAPE '!';
```

Run the cleanup only after verifying the prefix matches the generated
test rows in this database. Preserve original documents and do not
delete users. Then confirm the remaining document counts.

## 6. What remains to test

### Priority 0 --- before calling document-list performance work complete

-   [ ] Verify multi-owner test-data cleanup and original document
    preservation.
-   [ ] Inspect the complete query plan output for representative owners
    and datasets.
-   [ ] Implement and test pagination (cursor/keyset pagination is a
    candidate because the query is ordered by
    `updated_at DESC, id DESC`).
-   [ ] Test first page, next page, empty result, invalid cursor, and
    stable ordering.
-   [ ] Test CRUD correctness, validation errors, not-found cases, and
    ownership isolation.

### Priority 1 --- load and resilience

-   [ ] Repeat load tests at gradually increasing arrival rates and
    record p50/p95/p99, throughput, errors, and HTTP 429 responses.
-   [ ] Test database connection-pool saturation, queued requests, and
    connection limits.
-   [ ] Test simultaneous updates/deletes and concurrent creates.
-   [ ] Test invalid/expired access tokens, refresh-token behavior, and
    rate limiting.

### Priority 2 --- larger-scale characterization

-   [ ] Test a larger dataset (for example, 100k+ documents) with a
    realistic distribution across many owners.
-   [ ] Compare query plans and timings before/after pagination using
    equivalent datasets and cache conditions.
-   [ ] Measure payload-size impact and write/read contention.
-   [ ] Add or review production observability: structured logs,
    metrics, timeouts, and graceful shutdown.

## 7. Conclusion

The current evidence shows that the existing composite index is being
used for document-list queries, and the local Artillery CRUD run
completed 2,250 requests with no reported failures. The measured query
execution times were 0.060 ms on the original three-row table, 1.024 ms
with 10,003 rows belonging to one owner, and 0.140 ms for a selective
query returning 100 rows from a multi-owner dataset.

These results are useful baselines, not production guarantees.
Pagination, higher-load testing, connection-pool behavior, security edge
cases, and confirmed cleanup of the multi-owner seed remain outstanding.
