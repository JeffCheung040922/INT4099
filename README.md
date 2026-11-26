# Story Time

A tap-only English story game for Primary 5-6 pupils with mild intellectual disability (INT4099 group project, EdUHK).
Six stories at three levels, four parts each (words, sentences, reading, talk), a hint ladder with no penalty, and feedback
from an AI helper. The student site is `/`; the teacher site is `/teacher/`.

## Run it

```
node server.mjs                       # student site http://127.0.0.1:8765/  teacher site http://127.0.0.1:8765/teacher/
POE_API_KEY=your-key node server.mjs  # the same, with AI feedback (the key stays in the server process)
```

No build step and no packages are needed (Node 18 or newer). Opening `index.html` directly also works for the student
site; records then stay in that browser and the teacher site and AI feedback are off.

## Check it

```
node js/test.js          # stories, questions, hints, advice, record merging
node test-server.mjs     # server: bad URLs, other sites, bad records
```

## Notes

- All story text and questions are original and have not been checked by a teacher.
- Grammar follows the EDB English Language Curriculum Guide (P1-6), Appendix 4.
- Pictograms are by Sergio Palao, origin ARASAAC (arasaac.org), Government of Aragon, licence CC BY-NC-SA. See
  `assets/pics/ATTRIBUTION.txt`. Other art is drawn for this project; sound effects are generated in the browser.
- Players use nicknames only. Records are kept in `data/store.json` on the machine that runs the server.
