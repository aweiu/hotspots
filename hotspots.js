function createRect (parent) {
  const rect = document.createElement('div')
  rect.style.cssText = 'position: absolute; box-sizing: border-box; border: 2px solid red; left: auto; top: auto; right: auto; bottom: auto;background-color: rgba(0, 0, 0, .3);'
  const mouseDownAndMove = new MouseDownAndMove(rect)
  mouseDownAndMove.before('down', e => e.target === rect)
  mouseDownAndMove.on('move', (e, start) => {
    rect.style.transform = `translate3d(${e.x - start.x}px, ${e.y - start.y}px, 0)`
  })
  mouseDownAndMove.on('up', (e, start) => {
    rect.style.transform = 'none'
    rect.style.top = rect.offsetTop + e.y - start.y + 'px'
    rect.style.left = rect.offsetLeft + e.x - start.x + 'px'
    rect.style.bottom = 'auto'
    rect.style.right = 'auto'
  })
  parent.appendChild(rect)
  return rect
}

function createRound (parent, top, left) {
  const size = '8px'
  const round = document.createElement('div')
  round.style.cssText = `position: absolute; width: ${size}; height: ${size}; border: 1px solid red; border-radius: ${size};background-color: white;`
  round.style.top = typeof top === 'string' ? top : (top + 'px')
  round.style.left = typeof left === 'string' ? left : (left + 'px')
  parent.appendChild(round)
  return round
}

class MouseDownAndMove {
  constructor (node) {
    this._onHooks = {}
    this._beforeHooks = {}
    node.addEventListener('mousedown', e => {
      if (e.button === 0 && this._runHook('before', 'down', e)) {
        this._isDown = true
        this._start = {x: e.x, y: e.y, offsetX: e.offsetX, offsetY: e.offsetY}
        this._runHook('on', 'down', e)
      }
    })
    node.addEventListener('mouseup', e => {
      if (e.button === 0 && this._isDown) {
        this._isDown = false
        this._runHook('on', 'up', e)
      }
    })
    node.addEventListener('mousemove', e => {
      if (this._isDown) {
        e.preventDefault()
        this._runHook('on', 'move', e)
      }
    })
  }

  _runHook (type, name, e) {
    const hook = type === 'on' ? this._onHooks[name] : this._beforeHooks[name]
    if (typeof hook === 'function') return hook(e, this._start)
    return true
  }

  on (name, handler) {
    this._onHooks[name] = handler
  }

  before (name, handler) {
    this._beforeHooks[name] = handler
  }
}

function createRounds (parent) {
  const size = 5
  const positions = [
    {
      top: -size,
      left: [-size, `-webkit-calc(50% - ${size}px)`, `-webkit-calc(100% - ${size}px)`]
    },
    {
      top: `-webkit-calc(50% - ${size}px)`,
      left: [-size, `-webkit-calc(100% - ${size}px)`]
    },
    {
      top: `-webkit-calc(100% - ${size}px)`,
      left: [-size, `-webkit-calc(50% - ${size}px)`, `-webkit-calc(100% - ${size}px)`]
    }
  ]
  let code = 0
  const cursors = ['nwse', 'ns', 'nesw', 'ew', 'ew', 'nesw', 'ns', 'nwse']
  for (let {top, left} of positions) {
    for (let _left of left) {
      const round = createRound(parent, top, _left)
      round._roundCode = code++
      round.style.cursor = cursors[round._roundCode] + '-resize'
    }
  }
}

class Hotspots {
  constructor (container) {
    this._container = container
    this._containerRect = container.getBoundingClientRect()
    const mouseDownAndMove = new MouseDownAndMove(container)
    mouseDownAndMove.before('down', e => e.target.hasOwnProperty('_roundCode') || e.target !== this._rect)
    mouseDownAndMove.on('down', (e, start) => {
      this._target = e.target
      if (e.target.hasOwnProperty('_roundCode')) {
        const roundCode = e.target._roundCode
        this._rect.style.cursor = e.target.style.cursor
        const rect = this._getRect()
        const isTop = roundCode > 2
        const isLeft = [2, 4, 7].indexOf(roundCode) !== -1
        this._start = {offsetX: isLeft ? rect.left + 2 : rect.right, offsetY: isTop ? rect.top + 2 : rect.bottom}
        const x = e.x - e.offsetX + 8
        const y = e.y - e.offsetY - 2
        this._start.x = isLeft ? x - rect.width : x + rect.width
        this._start.y = isTop ? y - rect.height : y + rect.height
      } else if (e.target !== this._rect) {
        this._start = start
        if (this._rect) {
          container.removeChild(this._rect)
          this._rect = null
        }
      }
    })
    mouseDownAndMove.on('up', () => {
      if (!this._rect) return
      if (!this._target.hasOwnProperty('_roundCode')) createRounds(this._rect)
      else this._rect.style.cursor = 'move'
    })
    mouseDownAndMove.on('move', e => {
      if (!this._rect) this._rect = createRect(container)
      const w = e.x - this._start.x
      const h = e.y - this._start.y
      this._setPosition('left', w)
      this._setPosition('top', h)
      const roundCode = this._target._roundCode
      if ([1, 6].indexOf(roundCode) === -1) this._rect.style.width = Math.abs(w) + 'px'
      if ([3, 4].indexOf(roundCode) === -1) this._rect.style.height = Math.abs(h) + 'px'
    })
  }

  _setPosition (type, size) {
    const attr = {left: ['right', 'width', 'offsetX'], top: ['bottom', 'height', 'offsetY']}[type]
    const rect = this._rect
    if (size < 0 && rect.style[attr[0]] === 'auto') {
      rect.style[attr[0]] = this._containerRect[attr[1]] - this._start[attr[2]] + 'px'
      rect.style[type] = 'auto'
    } else if (size > 0 && rect.style[type] === 'auto') {
      rect.style[attr[0]] = 'auto'
      rect.style[type] = this._start[attr[2]] + 'px'
    }
  }

  _getRect () {
    const rect = this._rect.getBoundingClientRect()
    return {
      left: this._rect.offsetLeft,
      right: this._rect.offsetLeft + rect.width,
      top: this._rect.offsetTop,
      bottom: this._rect.offsetTop + rect.height,
      width: rect.width,
      height: rect.height
    }
  }

  set (spots) {
    const container = this._container
    if (this._rect) container.removeChild(this._rect)
    if (!spots) return (this._rect = null)
    this._rect = createRect(container)
    const {width, height} = this._containerRect
    const {selectBoxLeft, selectBoxTop, selectBoxWidth, selectBoxHeight, containerWidth, containerHeight} = spots
    const xRate = width / containerWidth
    const yRate = height / containerHeight
    this._rect.style.left = selectBoxLeft * xRate + 'px'
    this._rect.style.top = selectBoxTop * yRate + 'px'
    this._rect.style.width = selectBoxWidth * xRate + 'px'
    this._rect.style.height = selectBoxHeight * yRate + 'px'
    createRounds(this._rect)
  }

  get () {
    if (!this._rect) return
    const {width: containerWidth, height: containerHeight} = this._containerRect
    let {left, top, width, height} = this._getRect()
    return {
      containerWidth,
      containerHeight,
      selectBoxLeft: left,
      selectBoxTop: top,
      selectBoxWidth: width,
      selectBoxHeight: height
    }
  }
}
