import deepcopy from 'deepcopy'
import { events } from './events'
import { onUnmounted } from 'vue'

/**
 * 工具栏按钮 撤销、重做
 *
 * @returns
 */
export function useCommand(data, focusData) {
  /**
   * 【状态】：前进后退需要的指针
   *
   * current      前进后退的索引值
   * queue        存放所有的操作命令
   * commands     制作命令和执行功能一个映射表 undo: Fn redo: Fn
   * commandArray 存放所有的命令
   * destroyArray  销毁列表
   */
  const state = {
    current: -1,
    queue: [],
    commands: {},
    commandArray: [],
    destroyArray: []
  }

  //【注册命令】
  const registry = command => {
    state.commandArray.push(command)
    state.commands[command.name] = (...args) => {
      const { redo, undo } = command.execute(...args)
      redo()
      // 不需要放到队列中直接跳过即可
      if (!command.pushQueue) {
        return
      }
      let { queue, current } = state

      // 如果先放了 组件1 - 组件2 - 撤回 - 组件3
      // 组件1 - 组件3
      if (queue.length > 0) {
        queue = queue.slice(0, current + 1) // 可能在放置的过程中有撤销操作，所以根据当前最新的current值来计算新的队列
        state.queue = queue
      }

      queue.push({ redo, undo }) // 保存指令的前进后退
      state.current = current + 1
      console.log('拖拽队列', queue)
    }
  }

  /**
   * 【注册快捷键】
   * 【注册方法-需要做什么】
   */
  registry({
    name: 'redo',
    keyboard: 'ctrl+y',
    execute() {
      return {
        redo() {
          console.log('重做')
          let item = state.queue[state.current + 1] // 找到当前的下一步还原操作
          if (item) {
            item.redo && item.redo()
            state.current++
          }
        }
      }
    }
  })
  registry({
    name: 'undo',
    keyboard: 'ctrl+z',
    execute() {
      return {
        redo() {
          console.log('撤销')
          if (state.current === -1) return // 没有可以撤销的了
          let item = state.queue[state.current] // 找到上一步还原
          if (item) {
            item.undo && item.undo()
            state.current--
          }
        }
      }
    }
  })

  /**
   * 注册拖拽事件
   *
   * 如果希望将操作放到队列中可以增加一个属性标记pushQueue，稍后操作要放到队列中
   */
  registry({
    name: 'drag',
    pushQueue: true,
    // 初始化操作 默认就会执行
    init() {
      // 之前的状态
      this.before = null
      // 监控拖拽开始事件，保存状态
      const start = () => (this.before = deepcopy(data.value.blocks))
      // 拖拽之后需要触发对应的指令
      const end = () => state.commands.drag()
      events.on('start', start)
      events.on('end', end)

      return () => {
        events.off('start', start)
        events.off('end', end)
      }
    },
    execute() {
      let before = this.before
      let after = data.value.blocks // 之后的状态

      return {
        // 默认一松手 就直接把当前事情做了
        redo() {
          data.value = { ...data.value, blocks: after }
        },
        // 前一步的
        undo() {
          data.value = { ...data.value, blocks: before }
        }
      }
    }
  })

  /**
   * 更新整个容器 - 用于导入JSON
   *
   * 带有历史记录的常用模式：before after
   */
  registry({
    name: 'updateContainer',
    pushQueue: true,
    execute(newValue) {
      let state = {
        before: data.value, // 当前的值
        after: newValue // 新值
      }
      return {
        // 前进
        redo: () => {
          data.value = state.after
        },
        // 后退
        undo: () => {
          data.value = state.before
        }
      }
    }
  })

  /**
   * 更新某个容器组件 - 用于导入JSON
   *
   * 带有历史记录的常用模式：before after
   */
  registry({
    name: 'updateBlock',
    pushQueue: true,
    execute(newBlock, oldBlock) {
      let state = {
        before: data.value.blocks,
        after: (() => {
          // 拷贝blocks
          let blocks = [...data.value.blocks]
          const index = data.value.blocks.indexOf(oldBlock)
          if (index > -1) {
            // 不能改变原有的，需要使用新生成的 blocks
            blocks.splice(index, 1, newBlock)
          }
          return blocks
        })()
      }
      return {
        redo: () => {
          data.value = { ...data.value, blocks: state.after}
        },
        undo: () => {
          data.value = { ...data.value, blocks: state.before }
        }
      }
    }
  })

  /**
   * 置顶操作
   */
  registry({
    name: 'placeTop',
    pushQueue: true,
    execute() {
      let before = deepcopy(data.value.blocks)
      // 置顶就是在所有的block中找到最大的zIndex
      let after = (() => {
        let { focusArr, unFocusArr } = focusData.value
        let maxZIndex = unFocusArr.reduce((prev, block) => {
          return Math.max(prev, block.zIndex)
        }, -Infinity)

        console.log({ focusArr, unFocusArr, maxZIndex })

        // 让当前选中的比最大的+1
        focusArr.forEach(block => (block.zIndex = maxZIndex + 1))
        return data.value.blocks
      })()
      return {
        undo: () => {
          // 如果当前blocks 前后一致 则不会更新 => 解决方案👆 深拷贝
          data.value = { ...data.value, blocks: before }
        },
        redo: () => {
          data.value = { ...data.value, blocks: after }
        }
      }
    }
  })

  /**
   * 置底操作
   */
  registry({
    name: 'placeBottom',
    pushQueue: true,
    execute() {
      let before = deepcopy(data.value.blocks)
      // 置顶就是在所有的block中找到最大的zIndex
      let after = (() => {
        let { focusArr, unFocusArr } = focusData.value
        let minZIndex =
          unFocusArr.reduce((prev, block) => {
            return Math.min(prev, block.zIndex)
          }, Infinity) - 1

        /**
         * 不能直接-1 因为index 不能出现负值 负值就看不到组件了
         *
         * 解决方案：这里如果是负值，则让每选中的向上，自己变成0
         */
        if (minZIndex < 0) {
          const dur = Math.abs(minZIndex)
          minZIndex = 0
          unFocusArr.forEach(block => (block.zIndex += dur))
        }
        // 控制选中的值
        focusArr.forEach(block => (block.zIndex = minZIndex))
        return data.value.blocks
      })()
      return {
        undo: () => {
          // 如果当前blocks 前后一致 则不会更新 => 解决方案👆 深拷贝
          data.value = { ...data.value, blocks: before }
        },
        redo: () => {
          data.value = { ...data.value, blocks: after }
        }
      }
    }
  })

  /**
   * 删除操作
   */
  registry({
    name: 'delete',
    pushQueue: true,
    execute() {
      let state = {
        before: deepcopy(data.value.blocks), // 当前的值
        after: focusData.value.unFocusArr // 选中的都删除了，留下的都是没选中的
      }
      return {
        redo: () => {
          data.value = { ...data.value, blocks: state.after }
        },
        undo: () => {
          data.value = { ...data.value, blocks: state.before }
        }
      }
    }
  })

  // 键盘事件
  const keyboardEvent = (() => {
    const keyCodes = {
      90: 'z',
      89: 'y'
    }
    const onKeydown = e => {
      const { ctrlKey, keyCode } = e // ctrl + z ctrl + y
      let keyString = []
      if (ctrlKey) keyString.push('ctrl')
      keyString.push(keyCodes[keyCode])
      keyString = keyString.join('+')

      state.commandArray.forEach(({ keyboard, name }) => {
        if (!keyboard) return // 没有键盘事件
        if (keyboard === keyString) {
          state.commands[name]()
          e.preventDefault()
        }
      })
    }
    /**
     * 初始化事件
     * @returns 销毁事件
     */
    const init = () => {
      window.addEventListener('keydown', onKeydown)
      return () => {
        window.removeEventListener('keydown', onKeydown)
      }
    }
    return init
  })()

  ;(() => {
    // 监听键盘事件
    state.destroyArray.push(keyboardEvent())
    state.commandArray.forEach(command => command.init && state.destroyArray.push(command.init()))
  })()

  // 组件卸载调用销毁函数，清理绑定的事件
  onUnmounted(() => {
    state.destroyArray.forEach(fn => fn && fn())
  })

  return state
}
