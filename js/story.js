// Six stories at three levels. Every story has the same four parts with five questions each (20 questions):
// words, sentences, reading, talk. The question types vary: tap the word for a picture, find the picture for a
// word, match words to pictures, put words in order, fill a gap (with pictures, or choose the right verb),
// choose the correct sentence, read and answer, true or false, choose the reply in a talk.
// Grammar follows the EDB English Language Curriculum Guide (P1-6, 2025), Appendix 4, page A11:
//   KS1 (P1-3): simple present, present continuous, simple past, "can", and questions with am/is/are/do/does/did.
//   KS2 (P4-6): adds the future with "will" (used in level 3 only).
// Level 1 uses simple present and "can"; level 2 adds "now" (present continuous), "yesterday" (past simple) and
// questions with Do/Does/Did/Is; level 3 adds "tomorrow" (will) and "last night". Present perfect, past continuous
// and conditionals are KS2 and are left out as too hard for the learners.
// All text is original; no question, text or picture comes from a real paper. A teacher must approve it before real
// use. Every word shown as a picture is an ARASAAC pictogram that exists in assets/pics. Reading questions point at
// the line that holds the answer (hint 1).

const SIGN = { kind: "sign" };
const label = (pic, title) => ({ kind: "label", pic, title });
const chat = (line, who) => ({ kind: "chat", title: `${who} says`, lines: [line] });
const banner = (title) => ({ kind: "banner", title });
const mc = (card, q, options, answer, evidence, extra = {}) => ({ type: "mc", card, q, options, answer, evidence, ...extra });
const findPic = (word, options, answer) => mc({ kind: "word", text: word }, "Find the picture.", options, answer, undefined, { pics: true });
const match = (who, pairs) => ({ type: "match", card: chat("Match each word to its picture.", who), pairs });
const order = (sentence, card = SIGN) => ({ type: "order", card, sentence });
const gap = (before, options, answer, x = {}) => ({ type: "gap", card: x.card || SIGN, before, after: x.after || ".", options, answer, pics: !!x.pics, cue: x.cue, target: x.target });
const tense = (before, options, answer, cue, x = {}) => gap(before, options, answer, { ...x, cue, target: "grammar" });
const right = (options, answer) => mc(banner("Spot the mistake"), "Which sentence is correct?", options, answer, undefined, { target: "grammar" });
const tf = (card, q, truth, evidence) => mc(card, q, ["True", "False"], truth ? 0 : 1, evidence);
const talkG = (who, line, options, answer) => mc(chat(line, who), "What do you say?", options, answer, undefined, { target: "grammar" });
const talk = (who, line, options, answer) => mc(chat(line, who), "What do you say?", options, answer);
const part = (beats, items) => ({ beats, items });

// What the four parts are called and how they are scored (target = the row in the teacher's view).
const KINDS = {
  words: { id: "words", target: "words", tag: "Words", title: "Words and pictures", how: "Match the words and the pictures." },
  sentence: { id: "sentence", target: "sentence", tag: "Sentences", title: "Sentences", how: "Build it, fill it, or check it." },
  reading: { id: "reading", target: "reading", tag: "Reading", title: "Read and answer", how: "Read, then tap the answer." },
  talk: { id: "talk", target: "talk", tag: "Talk", title: "Join the talk", how: "Tap the best reply." },
};
const KIND_ORDER = ["words", "sentence", "reading", "talk"];

const POSTER = { kind: "poster", title: "Happy Hall Food Bank", lines: ["Helpers wanted!", "Saturday, 9:00 a.m.", "Bring a friend.", "Free lunch for all helpers."] };
const LIST = { kind: "note", title: "Mimi's list", lines: ["I need fish for lunch.", "I need milk for tea.", "I need three eggs for the cake.", "I do not need a dog!"] };
const NOTICE = { kind: "poster", title: "School Notice", lines: ["Rainy day: no sports today.", "Bring an umbrella.", "School ends at 3:00 p.m."] };
const RACE = { kind: "article", title: "Sam's Big Race", lines: ["Sam is in a race today.", "He runs to the park gate.", "His mum is at the gate.", "She gives him some water.", "Sam is very happy."] };
const MISSION = { kind: "note", title: "Mission note", lines: ["Mission: Fly to the moon.", "Start: 8:00 p.m.", "Bring one robot and one friend.", "Do not forget your helmet!"] };
const ZOO_TEXT = { kind: "article", title: "Zog's Zoo", lines: ["Zog has a zoo on Planet Zog.", "There are two rabbits and one elephant.", "The monkey likes bananas.", "The zoo opens at ten o'clock."] };
const ZOO = { kind: "sign", title: "Zoo sign" };

const STORIES = [
  {
    id: "cat-pantry", level: 1, title: "Mimi the Cat's Pantry", hero: "Mimi", guide: "mimi", scene: 2, blurb: "A hungry cat looks for lunch", arrive: "fish", cheer: "Yum!",
    words: part(["Meow! I am Mimi. I am a cat.", "I am very hungry. Let's look in the pantry.", "What is in each box?"], [
      mc(label("fish"), "What is in the box?", ["fish", "milk", "cake"], 0),
      findPic("milk", ["egg", "milk", "bread"], 1),
      match("Mimi", ["fish", "milk", "egg"]),
      mc(label("egg"), "What is in the box?", ["cake", "egg", "bread"], 1),
      findPic("cake", ["fish", "cake", "apple"], 1),
    ]),
    sentence: part(["I want to write a note for my friend."], [
      order("I am a cat."),
      gap("Mimi is hungry. She wants", ["fish", "book", "hat"], "fish", { pics: true }),
      right(["Mimi drink milk.", "Mimi drinks milk.", "Mimi drinking milk."], 1),
      order("The cat drinks milk."),
      gap("Mimi", ["can", "cans", "is can"], "can", { after: " jump very high.", target: "grammar" }),
    ]),
    reading: part(["Here is my shopping list. Please read it."], [
      mc(LIST, "What does Mimi need for lunch?", ["Fish", "Milk", "Eggs"], 0, 0),
      mc(LIST, "How many eggs does Mimi need?", ["Two", "Three", "Four"], 1, 2),
      tf(LIST, "Mimi needs a dog.", false, 3),
      mc(LIST, "What does Mimi need for tea?", ["Fish", "Milk", "Eggs"], 1, 1),
      tf(LIST, "Mimi needs three eggs.", true, 2),
    ]),
    talk: part(["Look! My friend Bo the dog is here."], [
      talk("Bo the dog", "Hello, Mimi! Are you hungry?", ["Yes, I am.", "It is a book.", "I am blue."], 0),
      talk("Bo the dog", "Do you want some milk?", ["It is Monday.", "Yes, please.", "I am a dog."], 1),
      talk("Bo the dog", "Do you like fish?", ["Yes, I do.", "It is red.", "I am nine."], 0),
      talkG("Bo the dog", "Can you jump?", ["Yes, I can.", "It is a cat.", "I am green."], 0),
      talk("Bo the dog", "What do you like?", ["I like fish.", "It is Monday.", "I am a cat."], 0),
    ]),
  },
  {
    id: "food-bank", level: 1, title: "Sophie's Food Bank", hero: "Sophie", guide: "sophie", scene: 0, blurb: "Help at a food bank",
    words: part(["Good morning! Welcome to the food bank.", "Many people will come today. They are hungry.", "Help me label the boxes."], [
      mc(label("bread"), "What is in the box?", ["bread", "apple", "milk"], 0),
      findPic("water", ["water", "milk", "apple"], 0),
      match("Sophie", ["bread", "water", "apple"]),
      mc(label("juice"), "What is in the box?", ["juice", "water", "milk"], 0),
      findPic("bread", ["apple", "bread", "milk"], 1),
    ]),
    sentence: part(["Now we need a sign for the front door."], [
      order("Sophie is a social worker."),
      gap("The people come to eat. They are", ["hungry", "happy", "sad"], "hungry", { pics: true }),
      tense("Every day, Sophie", ["helps", "help", "helped"], "helps", "Every day", { after: " people." }),
      order("She helps hungry people."),
      gap("Sophie", ["can", "cans", "is can"], "can", { after: " help many people.", target: "grammar" }),
    ]),
    reading: part(["Look at our poster. We need helpers!"], [
      mc(POSTER, "What is the poster for?", ["Finding helpers", "Selling food", "A birthday party"], 0, 0),
      mc(POSTER, "When do the helpers start?", ["Friday, 9:00 a.m.", "Saturday, 9:00 a.m.", "Sunday, 3:00 p.m."], 1, 1),
      tf(POSTER, "Helpers get free lunch.", true, 3),
      mc(POSTER, "What should helpers bring?", ["A friend", "A bag", "A hat"], 0, 2),
      tf(POSTER, "The helpers start on Sunday.", false, 1),
    ]),
    talk: part(["Here comes our first visitor!"], [
      talk("Visitor", "Hello! Can I have some bread?", ["Yes, here you are.", "It is Monday.", "I am a vet."], 0),
      talk("Visitor", "Thank you, Sophie!", ["It is red.", "You are welcome.", "I am eight."], 1),
      talk("Visitor", "Do you want some water?", ["Yes, please.", "It is Monday.", "I am a vet."], 0),
      talk("Visitor", "Is the bread free?", ["Yes, it is free.", "I am a bag.", "It is eight."], 0),
      talkG("Visitor", "What are you doing now?", ["I am giving out bread.", "I gave bread tomorrow.", "It is a bread."], 0),
    ]),
  },
  {
    id: "rainy-day", level: 2, title: "Lily's Rainy Day", hero: "Lily", guide: "lily", scene: 1, blurb: "A rainy morning at school",
    words: part(["Oh no, it is a rainy day!", "I need my school things."], [
      mc(label("umbrella", "Lily's bag"), "What is this?", ["umbrella", "bag", "hat"], 0),
      findPic("book", ["pencil", "book", "ruler"], 1),
      match("Lily", ["umbrella", "bag", "hat"]),
      mc(label("pencil", "Lily's bag"), "What is this?", ["pencil", "ruler", "book"], 0),
      findPic("umbrella", ["bag", "hat", "umbrella"], 2),
    ]),
    sentence: part(["Let me write in my diary."], [
      order("It is rainy today."),
      tense("Right now, it", ["is raining", "rained", "rains"], "is raining", "Right now", { after: " outside." }),
      right(["Lily are at school.", "Lily is at school.", "Lily am at school."], 1),
      order("I go to school."),
      tense("Yesterday, Lily", ["walked", "walks", "is walking"], "walked", "Yesterday", { after: " to school." }),
    ]),
    reading: part(["There is a notice on the wall."], [
      mc(NOTICE, "What should pupils bring?", ["An umbrella", "A hat", "A ball"], 0, 1),
      mc(NOTICE, "When does school end?", ["2:00 p.m.", "3:00 p.m.", "4:00 p.m."], 1, 2),
      tf(NOTICE, "There is sports today.", false, 0),
      mc(NOTICE, "Why is there no sports today?", ["It is rainy.", "It is sunny.", "It is Sunday."], 0, 0),
      tf(NOTICE, "Pupils bring an umbrella.", true, 1),
    ]),
    talk: part(["Here comes my teacher."], [
      talk("Miss Chan", "Good morning, Lily!", ["Good morning, Miss Chan.", "It is a cat.", "I am nine."], 0),
      talkG("Miss Chan", "Did you bring your umbrella?", ["It is blue.", "Yes, I did.", "I am a book."], 1),
      talkG("Miss Chan", "What are you doing now?", ["I am reading.", "I read tomorrow.", "I will reading."], 0),
      talkG("Miss Chan", "Do you like rainy days?", ["Yes, I do.", "Yes, I am.", "Yes, I did."], 0),
      talkG("Miss Chan", "Is it raining now?", ["Yes, it is.", "Yes, I do.", "Yes, it does."], 0),
    ]),
  },
  {
    id: "sports-day", level: 2, title: "Sam's Sports Day", hero: "Sam", guide: "sam", scene: 3, blurb: "A sunny day at the park",
    words: part(["Today is Sports Day! I love it.", "It is sunny and the pool is open."], [
      mc(label("swim", "Sports Day"), "What is Sam doing?", ["swim", "run", "sleep"], 0),
      findPic("sunny", ["rainy", "sunny", "snow"], 1),
      match("Sam", ["swim", "run", "hat"]),
      mc(label("hat", "Sports Day"), "What is this?", ["hat", "shoes", "shirt"], 0),
      findPic("run", ["run", "sit", "swim"], 0),
    ]),
    sentence: part(["Let me write about my day."], [
      order("Sam is running."),
      tense("Yesterday, Sam", ["swam", "swims", "is swimming"], "swam", "Yesterday", { after: " in the pool." }),
      right(["Sam run to the gate.", "Sam runs to the gate.", "Sam running to the gate."], 1),
      order("I like to swim."),
      tense("Right now, Sam", ["is running", "ran", "runs"], "is running", "Right now", { after: " to the gate." }),
    ]),
    reading: part(["Our class wrote about the race."], [
      mc(RACE, "Where does Sam run?", ["To the park gate", "To the sea", "To school"], 0, 1),
      mc(RACE, "What does Mum give Sam?", ["Bread", "Water", "A hat"], 1, 3),
      tf(RACE, "Sam is sad.", false, 4),
      mc(RACE, "Who is at the gate?", ["His mum", "His dad", "His teacher"], 0, 2),
      tf(RACE, "Sam runs to school.", false, 1),
    ]),
    talk: part(["The coach is calling me."], [
      talk("Coach", "Are you ready for the race?", ["Yes, I am ready.", "It is a hat.", "I am a fish."], 0),
      talkG("Coach", "What did you do yesterday?", ["I swam in the pool.", "I swim tomorrow.", "I am swimming yesterday."], 0),
      talk("Coach", "Well done, Sam!", ["It is a pig.", "Thank you!", "I have a bag."], 1),
      talkG("Coach", "Did you like the race?", ["Yes, I did.", "Yes, I do.", "Yes, I am."], 0),
      talkG("Coach", "Are you tired now?", ["Yes, I am.", "Yes, I do.", "Yes, I did."], 0),
    ]),
  },
  {
    id: "rocket", level: 3, title: "Captain Bolt's Rocket", hero: "Captain Bolt", guide: "bolt", scene: 4, blurb: "A robot flies to the moon", arrive: "star", cheer: "Wow!",
    words: part(["Beep boop! I am Captain Bolt.", "Today we fly to the moon!", "Check the pictures on the control screen."], [
      mc(label("rocket", "Control screen"), "What is this?", ["rocket", "planet", "moon"], 0),
      findPic("moon", ["star", "moon", "planet"], 1),
      match("Captain Bolt", ["rocket", "star", "planet"]),
      mc(label("star", "Control screen"), "What is this?", ["star", "moon", "rocket"], 0),
      findPic("planet", ["planet", "star", "moon"], 0),
    ]),
    sentence: part(["Write the mission log, please."], [
      order("We will fly to the moon."),
      tense("Tomorrow, we", ["will fly", "flew", "are flying"], "will fly", "Tomorrow", { after: " to the moon." }),
      right(["The rocket flew yesterday.", "The rocket fly yesterday.", "The rocket flying yesterday."], 0),
      order("The rocket is red."),
      tense("Right now, the robot", ["is looking", "looked", "looks"], "is looking", "Right now", { after: " at the star." }),
    ]),
    reading: part(["Mission Control sent us a note. Read it."], [
      mc(MISSION, "Where is the rocket going?", ["To the moon", "To school", "To the sea"], 0, 0),
      mc(MISSION, "What time does the rocket start?", ["7:00 p.m.", "8:00 p.m.", "9:00 p.m."], 1, 1),
      tf(MISSION, "The mission starts in the morning.", false, 1),
      mc(MISSION, "What must Captain Bolt not forget?", ["His helmet", "His bag", "His hat"], 0, 3),
      tf(MISSION, "Captain Bolt goes alone.", false, 2),
    ]),
    talk: part(["Mission Control is calling!"], [
      talk("Mission Control", "Captain Bolt, are you ready?", ["Yes, I am ready.", "It is a moon.", "I am at home."], 0),
      talkG("Mission Control", "What did you check yesterday?", ["I checked the rocket.", "I check the rocket yesterday.", "I am checking the rocket yesterday."], 0),
      talkG("Mission Control", "What will you do tomorrow?", ["I will fly to the moon.", "I flew to the moon tomorrow.", "I am a robot."], 0),
      talkG("Mission Control", "Will you fly tomorrow?", ["Yes, I will.", "Yes, I did.", "Yes, I am."], 0),
      talkG("Mission Control", "Did you see the moon?", ["Yes, I did.", "Yes, I will.", "Yes, I do."], 0),
    ]),
  },
  {
    id: "zoo", level: 3, title: "Zog's Planet Zoo", hero: "Zog", guide: "zog", scene: 5, blurb: "An alien keeps a zoo",
    words: part(["Blub blub! I am Zog.", "I have a zoo on my planet.", "Which animal is which?"], [
      mc(label("rabbit", "Zog's zoo"), "What is this animal?", ["rabbit", "pig", "cow"], 0),
      findPic("elephant", ["monkey", "elephant", "duck"], 1),
      match("Zog", ["rabbit", "pig", "monkey"]),
      mc(label("duck", "Zog's zoo"), "What is this animal?", ["duck", "cow", "pig"], 0),
      findPic("pig", ["pig", "rabbit", "cow"], 0),
    ]),
    sentence: part(["Help me write the zoo signs."], [
      order("The monkey is eating bananas.", ZOO),
      tense("Last night, the duck", ["drank", "drinks", "is drinking"], "drank", "Last night", { after: " water.", card: ZOO }),
      right(["Zog have a zoo.", "Zog has a zoo.", "Zog having a zoo."], 1),
      order("I have a pig.", ZOO),
      tense("Tomorrow, Zog", ["will feed", "fed", "feeds"], "will feed", "Tomorrow", { after: " the rabbits.", card: ZOO }),
    ]),
    reading: part(["Visitors read this at the gate."], [
      mc(ZOO_TEXT, "What does the monkey like?", ["Bananas", "Fish", "Milk"], 0, 2),
      mc(ZOO_TEXT, "How many rabbits are there?", ["One", "Two", "Three"], 1, 1),
      tf(ZOO_TEXT, "The zoo opens at nine.", false, 3),
      mc(ZOO_TEXT, "Where is the zoo?", ["On Planet Zog", "In a park", "At school"], 0, 0),
      tf(ZOO_TEXT, "There are three rabbits.", false, 1),
    ]),
    talk: part(["A visitor has arrived at the gate."], [
      talk("Visitor", "Hello, Zog! Can I see the elephant?", ["It is a pen.", "Yes, come with me.", "I am sleeping."], 1),
      talkG("Visitor", "Did you feed the rabbits?", ["It is a pen.", "Yes, I did.", "I am sleeping."], 1),
      talkG("Visitor", "What are you doing now?", ["I am feeding the pig.", "I fed the pig tomorrow.", "It is a pig."], 0),
      talkG("Visitor", "Does the monkey like bananas?", ["Yes, it does.", "Yes, it is.", "Yes, it did."], 0),
      talk("Visitor", "Thank you, Zog!", ["You are welcome.", "It is a pen.", "I am sleeping."], 0),
    ]),
  },
];


// What each story is about: a goal that fills as the learner answers, the lines that link one part to the next,
// and the ending. They turn four sets of questions into one plot (set-up, middle, climax, resolution).
const STORY_EXTRA = {
  "cat-pantry": {
    goal: { label: "Mimi's lunch", pic: "fish" },
    after: { words: ["Now I know what is in each box!", "The fish is for sharing. I must write a note to my friend."], sentence: ["The note is ready. Now let me check my shopping list."], reading: ["I know what to buy now. Look, my friend Bo is here!"], talk: [] },
    ending: ["Bo shares his lunch with me. Yum yum!", "Thank you for helping me, friend. Purr!"],
  },
  "food-bank": {
    goal: { label: "People fed", pic: "bread" },
    after: { words: ["The boxes are ready. Now we need a sign for the door."], sentence: ["Everyone can see the sign now. Let me put up the poster too."], reading: ["People are coming already. Here is our first visitor!"], talk: [] },
    ending: ["Everyone has food today. Thank you for helping!", "You are a great helper."],
  },
  "rainy-day": {
    goal: { label: "Lily's day", pic: "umbrella" },
    after: { words: ["My bag is ready. I will write in my diary on the bus."], sentence: ["I am at school now. Look, there is a notice on the wall."], reading: ["Oh, here comes my teacher."], talk: [] },
    ending: ["I am dry and happy at school.", "Thank you for helping me on a rainy day!"],
  },
  "sports-day": {
    goal: { label: "The race", pic: "run" },
    after: { words: ["I have my things. Let me write about my day."], sentence: ["Our class wrote about the big race. Let's read it."], reading: ["The race is about to start. The coach is calling me."], talk: [] },
    ending: ["I finished the race! Mum gave me some water.", "Thank you for cheering for me."],
  },
  "rocket": {
    goal: { label: "Rocket fuel", pic: "rocket" },
    after: { words: ["All systems are ready. Time to write the mission log."], sentence: ["Mission Control sent us a note. Let me read it."], reading: ["Mission Control is calling us now."], talk: [] },
    ending: ["Three, two, one... lift off! We are flying to the moon!", "Great job, my friend. Beep boop!"],
  },
  "zoo": {
    goal: { label: "Happy animals", pic: "pig" },
    after: { words: ["Now I know my animals. Let me put up the zoo signs."], sentence: ["Visitors are reading the notice at the gate."], reading: ["Here comes a visitor!"], talk: [] },
    ending: ["Everyone loves my zoo. Blub blub!", "Thank you for helping me."],
  },
};
for (const st of STORIES) Object.assign(st, STORY_EXTRA[st.id]);

// The four parts of one story, in order, as the app plays them.
const buildParts = (story) => KIND_ORDER.map((k) => ({ ...KINDS[k], scene: story.scene, guide: story.guide, beats: story[k].beats, items: story[k].items, after: story.after[k] || [] }));

// Which items each run uses. "quick" is a short run for a live demo: one question per part, a different type each.
const MODES = {
  normal: { words: [0, 1, 2, 3, 4], sentence: [0, 1, 2, 3, 4], reading: [0, 1, 2, 3, 4], talk: [0, 1, 2, 3, 4] },
  quick: { words: [2], sentence: [1], reading: [2], talk: [1] },
};

// Every word shown as a picture in any story: the cards in "My words".
const itemWords = (it) => it.type === "match" ? it.pairs : it.pics && it.type === "mc" ? [it.options[it.answer]] : it.card.kind === "label" ? [it.card.pic] : it.type === "gap" && it.pics ? [it.answer] : [];
const wordSlots = () => [...new Set(STORIES.flatMap((st) => KIND_ORDER.flatMap((k) => st[k].items.flatMap(itemWords))))];

if (typeof module !== "undefined") module.exports = { STORIES, KINDS, KIND_ORDER, MODES, buildParts, wordSlots, itemWords };
