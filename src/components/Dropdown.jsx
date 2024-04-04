import { ElButton, ElDialog, ElInput } from 'element-plus'
import { computed, createVNode, defineComponent, onMounted, reactive, render, ref, onBeforeMount, provide, inject } from 'vue'

export const DropdownItem = defineComponent({
  props: {
    label: String,
    icon: String
  },
  setup(props) {
    let { label, icon } = props
    let hide = inject('hide')

    return () => (
      <div class="dropdown-item" onClick={hide}>
        <i class={icon}></i>
        <span>{label}</span>
      </div>
    )
  }
})

const DropdownComponent = defineComponent({
  props: {
    option: { type: Object }
  },
  setup(props, ctx) {
    const dropdownRef = ref(null)
    const state = reactive({
      isShow: false,
      top: 0,
      left: 0,
      option: props.option // 用户给组件的属性
    })
    // 向外暴露方法
    ctx.expose({
      showDropdown(option) {
        // 有可能每次传递属性不同，在这里及时更新，保证每次拿到最新的option
        state.option = option
        state.isShow = true
        // 获取右键菜单的位置信息
        let { top, left, height } = option.el.getBoundingClientRect()
        state.top = top + height
        state.left = left
      }
    })
    provide('hide', () => state.isShow = false)

    const classes = computed(() => ['dropdown', { 'dropdown-isShow': state.isShow }])
    const styles = computed(() => ({
      top: state.top + 'px',
      left: state.left + 'px'
    }))
    const onMousedownDocument = e => {
      // 如果点击的是 dropdown内部 什么都不做
      if (!dropdownRef.value.contains(e.target)) {
        state.isShow = false
      }
    }
    onMounted(() => {
      /**
       * 事件的传递行为是先捕获 再冒泡
       * 之前为了阻止事件传播 我们给 block都增加了 stopPropagation
       */
      document.body.addEventListener('mousedown', onMousedownDocument, true)
    })
    // 解绑事件
    onBeforeMount(() => {
      document.body.removeEventListener('mousedown', onMousedownDocument, true)
    })
    return () => {
      return (
        <div ref={dropdownRef} class={classes.value} style={styles.value}>
          {state.option.content()}
        </div>
      )
    }
  }
})

let vNode
export function $dropdown(option) {
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
    vNode = createVNode(DropdownComponent, { option })
    // 将组件渲染到这个el元素上；渲染成真实节点放到页面中
    document.body.appendChild((render(vNode, el), el))
  }

  // 组件实例获取expose暴露的方法
  let { showDropdown } = vNode.component.exposed
  showDropdown(option) // 其他说明组件已存在只需显示即可
}
