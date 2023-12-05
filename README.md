Exercise tracker solution for FreeCodeCamp's exercise at: <br/>
https://www.freecodecamp.org/learn/back-end-development-and-apis/back-end-development-and-apis-projects/file-metadata-microservice

Uses the **Express** framework on **NodeJS** runtime with a **MongoDB **backend.

Create a New User
```POST /api/users```

Add exercises
```POST /api/users/:_id/exercises```

GET user's exercise log
```
GET /api/users/:_id/logs?[from][&to][&limit]

[ ] = optional
from, to = dates (yyyy-mm-dd); limit = number
```
