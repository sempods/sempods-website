export const publicPod = 'https://sempods.org/aaltra';

export const publicQuery = `PREFIX schema: <https://schema.org/>
SELECT ?e ?name ?start WHERE {
  ?e a schema:Event ; schema:name ?name ; schema:startDate ?start
} ORDER BY ?start LIMIT 3`;

export const publicCurl = `curl -X POST ${publicPod}/_system/sparql/query \\
  -H "Content-Type: application/sparql-query" \\
  -H "Accept: application/sparql-results+json" \\
  --data '${publicQuery}'`;
