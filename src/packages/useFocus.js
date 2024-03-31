import { computed } from "vue"

/**
 * 获取那些元素被选中
 * @param {*} data 
 * @returns 
 */
export function useFocus(data, cb) {
  // 计算选中了那些元素，用于多元素批量移动
  const focusData = computed(() => {
    let focusArr = []
    let unFocusArr = []
    data.value.blocks.forEach(block => (block.focus ? focusArr : unFocusArr).push(block))
    return {
      focusArr,
      unFocusArr
    }
  })

  const clearBlockFocus = () => {
    data.value.blocks.forEach(block => (block.focus = false))
  }
  const containerMouseDown = () => {
    // 鼠标点击容器，让选中的失去焦点，取消全部选中效果
    clearBlockFocus()
  }
  const onMousedown = (e, block) => {
    e.preventDefault()
    e.stopPropagation()
    // block 上规划一个属性 focus 获取焦点后就将focus变为true
    if (e.shiftKey) {
      // 按住shift键，实现多选
      block.focus = !block.focus
    } else {
      if (!block.focus) {
        clearBlockFocus()
        // 每次点击清空其他元素的focus选中效果
        block.focus = true
      } else {
        block.focus = false
      }
    }
    cb(e)
  }

  return {
    containerMouseDown,
    onMousedown,
    focusData
  }
}