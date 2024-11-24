class Participant {
  constructor(name, id) {
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
  constructor(question, answer) {
    this.questionNumber = 1;
    this.question = question;
    this.answer = answer;
    this.players = [];
  }

  addPlayer(player) {
    this.players.push(player);
  }
  
  setQuestion(question) {
    this.question = question;
  }

  setAnswer(answer) {
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

module.exports = { Participant, WordScramble };