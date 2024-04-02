import { ElButton, ElDialog, ElInput } from 'element-plus'
import { createVNode, defineComponent, reactive, render } from 'vue'

const DialogComponent = defineComponent({
  props: {
    option: { type: Object }
  },
  setup(props, ctx) {
    const state = reactive({
      option: props.option, // 用户给组件的属性
      isShow: false
    })

    // 向外暴露方法
    ctx.expose({
      showDialog(option) {
        // 有可能每次传递属性不同，在这里及时更新，保证每次拿到最新的option
        state.option = option
        state.isShow = true
      }
    })

    const onCancel = () => {
      state.isShow = false
    }
    const onConfirm = () => {
      state.isShow = false
      state.option.onConfirm && state.option.onConfirm(state.option.content)
    }

    return () => {
      return (
        <ElDialog v-model={state.isShow} title={state.option.title}>
          {{
            default: () => <ElInput type="textarea" v-model={state.option.content} rows={10}></ElInput>,
            footer: () =>
              state.option.footer && (
                <div>
                  <ElButton onClick={onCancel}>取消</ElButton>
                  <ElButton type="primary" onClick={onConfirm}>
                    确定
                  </ElButton>
                </div>
              )
          }}
        </ElDialog>
      )
    }
  }
})

let vNode
export function $dialog(option) {
  // 当虚拟节点不存在时才创建，防止多次创建
  if (!vNode) {
    // 手动挂载组件
    let el = document.createElement('div')
    /**
     * 如何将组件渲染到某个节点上？
     * 1. 创建组件的虚拟节点 createVNode(类组件, 属性)
     * 2. 将虚拟节点变成真实节点，渲染到页面上 render(虚拟节点, 渲染元素)
     */

    // 将组件渲染成虚拟节点
    vNode = createVNode(DialogComponent, { option })
    // 将组件渲染到这个el元素上；渲染成真实节点放到页面中
    document.body.appendChild((render(vNode, el), el))
  }

  // 组件实例获取expose暴露的方法
  let { showDialog } = vNode.component.exposed
  showDialog(option) // 其他说明组件已存在只需显示即可
}
