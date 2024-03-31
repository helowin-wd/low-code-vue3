import { ElButton, ElInput } from 'element-plus'

// 组件注册列表
export const registerList = [
  {
    label: '文本',
    preview: '预览文本',
    render: '渲染文本',
    key: 'text'
  },
  {
    label: '按钮',
    preview: <ElButton>预览按钮</ElButton>,
    render: <ElButton>渲染按钮</ElButton>,
    key: 'button'
  },
  {
    label: '输入框',
    preview: <ElInput placeholder="预览输入框"></ElInput>,
    render: <ElInput placeholder="预览输入框"></ElInput>,
    key: 'input'
  }
]