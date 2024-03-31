export function useBlockDragger(focusData) {
  let dragState = {
    // 移动坐标信息
    startX: 0,
    startY: 0
  }
  const mousedown = e => {
    dragState = {
      startX: e.clientX,
      startY: e.clientY,
      /**
       * 场景一：选中一个直接按住拖拽
       * 场景二：选中多个，统一拖拽
       * 
       * 记录每一个选中的位置
       */
      startPos: focusData.value.focusArr.map(({ top, left }) => ({ top, left }))
    }
    document.addEventListener('mousemove', mousemove)
    document.addEventListener('mouseup', mouseup)
  }
  const mousemove = e => {
    let { clientX: moveX, clientY: moveY } = e
    // 移动距离 =  移动位置 - 组件开始位置
    let durX = moveX - dragState.startX
    let durY = moveY - dragState.startY
    // 当前移动位置 = 选中位置 + 移动距离
    focusData.value.focusArr.forEach((block, idx) => {
      block.top = dragState.startPos[idx].top + durY
      block.left = dragState.startPos[idx].left + durX
    })
  }
  const mouseup = e => {
    document.removeEventListener('mousemove', mousemove)
    document.removeEventListener('mouseup', mouseup)
  }

  return {
    mousedown,
    mousemove,
    mouseup
  }
}
