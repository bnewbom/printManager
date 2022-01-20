const printMgr = {
  exam: [],
  solve: [],
  vueData: Object,

  setVue(vueData) {
    this.vueData = vueData
    console.log(this.vueData)
  },

  //Fullurl 생성
  makeImgUrl(path, fileName) {
    const host = 'https://img.parallaxedu.com/'
    return host + path + '/' + fileName
  },

  //맞춤클리닉 시험지 생성
  setPrintClinic(student, clinicList) {
    console.log('setPrintClinic', student, clinicList)
    let quizList = []
    let clinicQuiz = []
    let clinicSolve = []

    if (clinicList.clinicList) {
      quizList = clinicList.clinicList
    } else if (clinicList.wrongAnswerQusList) {
      quizList = clinicList.wrongAnswerQusList
    } else {
      quizList = clinicList.tbQuestionList
    }

    //맞춤클리닉 문제 + 객관식 답안
    let index = 1
    if (quizList.length > 0) {
      for (let el of quizList) {
        let item = {
          no: index++,
          title: el.tpqOrder,
          unit2: el.quKeyword,
          url: this.makeImgUrl(
            el.quInstructionPath,
            el.quInstructionFilename + '.png'
            //  + `?timestamp=${new Date().getTime()}`
          ),
          height: 0,
          imgIsLoad: false,
          answer: []
        }

        let ansIndex = 0
        for (let ans of el.tbMultichoiceoptionList) {
          item.answer.push({
            no: ansIndex++,
            url: this.makeImgUrl(
              ans.quMultichoicePath,
              ans.mcoChoicefilename + '.png'
              // +`?timestamp=${new Date().getTime()}`
            ),
            height: 0,
            imgIsLoad: false
          })
        }
        clinicQuiz.push(item)
      }
    }

    //해설지
    let svIndex = 1
    if (clinicList.solveList) {
      for (let el of clinicList.solveList) {
        let item = {
          no: svIndex++,
          url: this.makeImgUrl(el.quSolvePath, el.quSolveFilename + '.png'),
          height: 0,
          imgIsLoad: false
        }
        clinicSolve.push(item)
      }
    }

    this.exam = {
      unit1: clinicList.unit1Name,
      name: clinicList.name,
      grade: clinicList.lbGrade,
      //date: this.vueData.currentDate,
      date: '2011-11-11',
      score: 100,
      loadCount: 0,
      isReady: false,
      imgs: clinicQuiz
    }

    this.solve = {
      unit1: clinicList.unit1Name,
      name: clinicList.name,
      //date: this.vueData.currentDate,
      date: '2011-11-11',
      loadCount: 0,
      isReady: false,
      imgs: clinicSolve
    }

    console.log('clinicQuiz', clinicQuiz)
    console.log('clinicSolve', clinicSolve)

    this.solve.imgs.forEach((el) => {
      this.setImgHeight(el, this, student, 'solve')
    })

    this.exam.imgs.forEach((el) => {
      this.setImgHeight(el, this, student, 'exam')

      el.answer.forEach((ans) => {
        this.setImgHeight(ans, this, student, 'answer')
      })
    })
  },

  //맞춤클리닉 시험지 이미지 onload
  setImgHeight(obj, parent, student, type) {
    const titleHeight = 41
    let newImg = new Image()
    newImg.src = obj.url
    // newImg.crossOrigin = 'Anonymous'
    // newImg.setAttribute('crossorigin', 'anonymous')
    // console.log(newImg)

    newImg.onload = function() {
      obj.imgIsLoad = true

      if (type === 'answer') {
        obj.height = this.height / 2
      } else {
        obj.height = this.height / 2 + titleHeight
      }

      parent.checkReady(student, type)
    }

    newImg.onerror = function() {
      obj.imgIsLoad = true
      console.log('newImg.onError', obj)

      parent.checkReady(student, type)
    }
  },

  //맞춤클리닉 이미지 onload 완료 체크
  checkReady(student, type) {
    if (type === 'exam' || type === 'answer') {
      for (let el of this.exam.imgs) {
        if (!el.imgIsLoad) {
          this.exam.isReady = false
          return
        }

        for (let ans of el.answer) {
          if (!ans.imgIsLoad) {
            this.exam.isReady = false
            return
          }
        }
      }
      this.exam.isReady = true
      this.sumHeight()
      this.setExamImg('exam')
    }

    if (type === 'solve') {
      for (let el of this.solve.imgs) {
        if (!el.imgIsLoad) {
          this.solve.isReady = false
          return
        }
        this.solve.isReady = true
      }
      this.setExamImg('solve')
    }

    if (this.solve.isReady && this.exam.isReady) {
      student.clinicPrint = true
      console.log('clinicPrint true')
    }
  },

  //문제랑 답안 height를 더해줌
  sumHeight() {
    if (!this.exam.isReady) {
      return
    }

    for (let el of this.exam.imgs) {
      for (let ans of el.answer) {
        el.height = el.height + ans.height
      }
    }
  },

  //맞춤클리닉 이미지 onload완료되면, 시험지 왼쪽/오른쪽 배치
  setExamImg(type) {
    console.log('setExamImg', type)

    let index = 0
    let maxHeight = 680
    let isLeft = true
    let pageArr = [{ left: [], right: [] }]
    let leftLeft = maxHeight
    let rightLeft = maxHeight

    //시험지 이미지 생성 부분, 왼쪽 섹션 & 오른쪽 섹션 & 페이지 구분
    let imgs = []
    if (type === 'exam') {
      imgs = this.exam.imgs
    } else {
      imgs = this.solve.imgs
    }

    for (let el of imgs) {
      if (isLeft) {
        if (leftLeft > el.height) {
          pageArr[index].left.push(el)
          leftLeft = leftLeft - el.height
        } else {
          isLeft = false
          leftLeft = maxHeight
        }
      }

      if (!isLeft) {
        if (rightLeft > el.height) {
          pageArr[index].right.push(el)
          rightLeft = rightLeft - el.height
        } else {
          isLeft = true
          rightLeft = maxHeight
          pageArr.push({ left: [], right: [] })
          index = index + 1

          pageArr[index].left.push(el)
          leftLeft = leftLeft - el.height
        }
      }
    }

    console.log('pageArr', type, pageArr)

    if (type === 'exam') {
      this.vueData.pageArr = pageArr
    } else {
      this.vueData.solvePageArr = pageArr
    }
  }
}
export default printMgr
