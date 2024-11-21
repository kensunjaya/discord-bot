class WordScramble {
  constructor() {
    this.questionNumber = 0;
    this.question;
    this.answer;
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

module.exports = { WordScramble }