// 列表区显示所有的物料
// key对应的组件映射关系
import { registerList } from "./editor-list"

function createEditorConfig() {
  // 左侧物料区
  const componentList = []
  // 内容区：
  // 映射：组件类型 - 组件配置
  const componentMap = {}

  return {
    componentList,
    componentMap,
    register: component => {
      componentList.push(component)
      componentMap[component.key] = component
    }
  }
}
export let registerConfig = createEditorConfig()

// 注册列表
registerList.forEach(item => {
  registerConfig.register({
    label: item.label,
    preview: () => item.preview,
    render: () => item.render,
    key: item.key
  })
})

// registerConfig.register({
//   label: "文本",
//   preview: () => '预览文本',
//   render: () => '渲染文本',
//   key: "text"
// })
// registerConfig.register({
//   label: "按钮",
//   preview: () => <ElButton>预览按钮</ElButton>,
//   render: () => <ElButton>渲染按钮</ElButton>,
//   key: "button"
// })
// registerConfig.register({
//   label: "输入框",
//   preview: () => <ElInput placeholder="预览输入框"></ElInput>,
//   render: () => <ElInput placeholder="渲染输入框"></ElInput>,
//   key: "input"
// })
