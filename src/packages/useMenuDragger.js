import { events } from "./events"

/**
 * 物料区拖拽相关
 * @param {*} containerRef 
 * @param {*} data 
 * @returns 
 */
export function useMenuDragger(containerRef, data) {
  // 当前拖动的组件(配置)
  let currentComp = null

  const dragenter = e => {
    e.dataTransfer.dropEffect = 'move'
  }

  const dragover = e => {
    e.preventDefault()
  }

  const dragleave = e => {
    e.dataTransfer.dropEffect = 'none'
  }

  const drop = e => {
    let blocks = data.value.blocks // 内部已经渲染的组件
    data.value = {
      ...data.value,
      blocks: [
        ...blocks,
        {
          top: e.offsetY,
          left: e.offsetX,
          zIndex: 1,
          key: currentComp.key,
          alignCenter: true // 希望松手的时候居中显示
        }
      ]
    }
    currentComp = null
  }

  /**
   * 拖拽开始
   *
   * dragenter 进入元素中 添加一个移动的标记
   * dragover 在目标元素经过 必须要阻止默认行为 否则不能触发drop
   * dragleave 离开元素的时候 需要添加一个禁用标记
   * drop 松手的时候 根据拖拽的组件 添加一个组件
   *
   * @param {*} e
   * @param {*} comp
   */
  const dragStart = (e, comp) => {
    containerRef.value.addEventListener('dragenter', dragenter)
    containerRef.value.addEventListener('dragover', dragover)
    containerRef.value.addEventListener('dragleave', dragleave)
    containerRef.value.addEventListener('drop', drop)
    currentComp = comp

    //【发布start】拖拽前记录状态 - 用于：撤销/重做功能
    events.emit("start")
  }
  const dragEnd = () => {
    containerRef.value.removeEventListener('dragenter', dragenter)
    containerRef.value.removeEventListener('dragover', dragover)
    containerRef.value.removeEventListener('dragleave', dragleave)
    containerRef.value.removeEventListener('drop', drop)

    //【发布end】拖拽后记录状态 - 用于：撤销/重做功能
    events.emit("end")
  }

  return {
    dragStart,
    dragEnd
  }
}
