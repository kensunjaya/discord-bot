class Player {
  name: string;
  id: string;
  score: number;

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
    this.score = 0;
  }

  getScore() {
    return this.score;
  }

  incrementScore() {
    this.score++;
  }
}

class WordScramble {
  questionNumber: number;
  question: string;
  answer: string;
  players: Player[];

  constructor() {
    this.questionNumber = 0;
    this.question;
    this.answer;
    this.players = [];
  }

  addPlayer(player: Player) {
    this.players.push(player);
  }
  
  setQuestion(question: string) {
    this.question = question;
  }

  setAnswer(answer: string) {
    this.answer = answer;
  }

  getQuestion() {
    return this.question;
  }

  getAnswer() {
    return this.answer;
  }

  getQuestionNumber() {
    return this.questionNumber;
  }

  incrementQuestionNumber() {
    this.questionNumber++;
  }
}

module.exports = { WordScramble, Player };