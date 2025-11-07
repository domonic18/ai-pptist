# 前端测试框架指南

## 📋 概述

本项目采用现代化的前端测试框架，基于 **Vitest** + **Vue Test Utils** + **Testing Library** 构建，提供全面的单元测试、集成测试和端到端测试支持。

## 🏗️ 测试架构

### 测试分层
- **单元测试** (`tests/unit/`)：快速执行，测试独立函数、组件和工具类
- **集成测试** (`tests/integration/`)：测试组件间交互和完整业务流程
- **端到端测试** (`tests/e2e/`)：模拟真实用户场景的全流程测试

### 测试框架
- **Vitest**：快速的单元测试框架
- **Vue Test Utils**：Vue 3 官方测试工具库
- **Testing Library**：专注于用户行为的测试
- **jsdom**：在 Node.js 环境中模拟浏览器环境

## 📁 目录结构

```
tests/
├── unit/                           # 单元测试
│   ├── components/                 # 组件测试
│   │   └── Button.test.ts
│   ├── services/                   # 服务测试
│   │   └── optimization.service.test.ts
│   ├── utils/                      # 工具函数测试
│   │   └── array.utils.test.ts
│   └── *.test.ts                   # 其他单元测试
│
├── integration/                    # 集成测试
│   └── optimization.flow.test.ts   # 优化流程集成测试
│
├── e2e/                            # 端到端测试
│   └── *.spec.ts
│
├── __mocks__/                      # Mock文件
│   └── axios.ts
│
├── setup.ts                        # 测试环境设置
└── README.md                       # 本文档
```

## 🚀 快速开始

### 安装依赖

测试依赖已包含在项目依赖中：

```bash
npm install
```

### 运行测试

#### 1. 运行所有测试

```bash
npm run test
```

#### 2. 运行单元测试

```bash
npm run test:unit
```

#### 3. 运行集成测试

```bash
npm run test:integration
```

#### 4. 运行特定测试文件

```bash
# 运行单个测试文件
npm run test -- optimization.service.test.ts

# 运行匹配特定模式的测试
npm run test -- --grep "应该过滤掉锁定的元素"
```

#### 5. 监视模式（开发时推荐）

```bash
# 监视所有测试文件变化
npm run test:watch

# 监视特定测试文件
npm run test:watch -- optimization.service.test.ts
```

#### 6. 生成覆盖率报告

```bash
# 生成文本覆盖率报告
npm run test:coverage

# 生成HTML覆盖率报告（详细）
npm run test:coverage -- --reporter=html
```

覆盖率报告将生成在 `coverage/` 目录下，浏览器打开 `coverage/index.html` 查看详细报告。

#### 7. 运行指定测试套件

```bash
# 只运行组件测试
npm run test -- --runInBand unit/components

# 运行特定标签的测试
npm run test -- --grep "优化"
```

## 📝 测试规范

### 1. 命名规范

**测试文件命名**：
- 单元测试：`*.test.ts` 或 `*.spec.ts`
- 集成测试：`*.test.ts`
- 端到端测试：`*.spec.ts`

**测试文件组织**：
```
tests/
├── unit/
│   ├── components/     # 组件测试
│   ├── services/       # 服务/工具类测试
│   ├── utils/          # 纯函数工具测试
│   └── *.test.ts       # 其他测试
```

### 2. 测试结构规范

使用 **AAA (Arrange-Act-Assert)** 模式：

```typescript
describe('FunctionName', () => {
  it('should do something when condition', () => {
    // Arrange - 准备测试数据和依赖
    const input = { /* ... */ }
    const expected = { /* ... */ }

    // Act - 执行被测试的函数
    const result = functionName(input)

    // Assert - 验证结果
    expect(result).toEqual(expected)
  })
})
```

### 3. 组件测试规范

**基础组件测试**：

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ComponentName from '@/components/ComponentName.vue'

describe('ComponentName', () => {
  it('应该渲染组件', () => {
    const wrapper = mount(ComponentName, {
      props: { /* props */ }
    })
    expect(wrapper.find('selector').exists()).toBe(true)
  })

  it('应该响应用户交互', async () => {
    const wrapper = mount(ComponentName)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('event-name')).toBeTruthy()
  })
})
```

### 4. 服务测试规范

**异步服务测试**：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { serviceFunction } from '@/services/service'

// Mock外部依赖
vi.mock('@/services/external')

describe('Service Function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该返回正确的数据', async () => {
    const result = await serviceFunction()
    expect(result).toBeDefined()
  })
})
```

### 5. 工具函数测试规范

**纯函数测试**：

```typescript
import { describe, it, expect } from 'vitest'
import { utilityFunction } from '@/utils/utility'

describe('utilityFunction', () => {
  it('应该处理正常输入', () => {
    const input = 'test'
    const result = utilityFunction(input)
    expect(result).toBe('expected')
  })

  it('应该处理边界情况', () => {
    // 测试空值、undefined等
  })
})
```

## 🛠️ 测试工具与配置

### Vitest 配置 (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,              // 启用全局测试API
    environment: 'jsdom',       // 使用jsdom环境
    setupFiles: ['./tests/setup.ts'], // 设置文件
    coverage: {                 // 覆盖率配置
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

### 测试设置 (`tests/setup.ts`)

每个测试文件运行前执行：
- 清理DOM
- 清除模拟
- 设置全局错误处理

### Mock 系统

使用 `__mocks__` 目录为外部库提供Mock：

```typescript
// tests/__mocks__/axios.ts
export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
}
```

## 📊 覆盖率要求

- **分支覆盖率**：≥ 70%
- **函数覆盖率**：≥ 80%
- **行覆盖率**：≥ 80%
- **语句覆盖率**：≥ 80%

运行 `npm run test:coverage` 查看详细报告。

## 🎯 最佳实践

### 1. 测试内容

**应该测试**：
- 组件渲染
- 用户交互
- 错误处理
- 边界情况
- 业务逻辑

**不需要测试**：
- 第三方库代码
- 简单的getter/setter
- 纯展示性组件（除非有交互逻辑）

### 2. 测试质量

- **描述清晰**：测试名称应该清晰说明测试内容
- **单一职责**：每个测试只验证一个行为
- **独立性**：测试之间不应该相互依赖
- **可重复**：测试结果应该稳定一致

### 3. Mock 使用

- **最小化Mock**：只Mock必要的外部依赖
- **精确控制**：Mock应该模拟真实行为
- **避免过度Mock**：过于详细的Mock会使测试脆弱

### 4. 异步测试

```typescript
// 使用async/await
it('应该处理异步操作', async () => {
  const result = await asyncFunction()
  expect(result).toBe('expected')
})

// 使用回调风格
it('应该处理异步操作', (done) => {
  asyncFunction().then(() => {
    expect(/* ... */)
    done()
  })
})
```

## 🔧 调试技巧

### 1. 查看渲染输出

```typescript
const wrapper = mount(Component)
console.log(wrapper.html()) // 打印组件HTML
console.log(wrapper.vm)     // 打印组件实例
```

### 2. 调试测试

```typescript
it('should debug', () => {
  // 使用debug()获取详细信息
  const wrapper = mount(Component)
  console.log(wrapper.debug())
})
```

### 3. 测试特定用例

```bash
# 只运行单个测试
npm run test -- --reporter=verbose --grep "测试名称"
```

## 📈 CI/CD 集成

在 GitHub Actions 或其他 CI 系统中运行测试：

```yaml
- name: Run tests
  run: npm run test:unit
```

```yaml
- name: Generate coverage
  run: npm run test:coverage
```

## ❓ 常见问题

### Q: 如何测试Vue Router导航？
A: 使用 `vue-router-mock` 或手动设置 `$route` 和 `$router`：

```typescript
const wrapper = mount(Component, {
  global: {
    mocks: {
      $route: { path: '/test' },
      $router: { push: vi.fn() }
    }
  }
})
```

### Q: 如何测试Pinia Store？
A: 使用 `pinia` 的测试工具：

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { useStore } from '@/stores/store'

beforeEach(() => {
  setActivePinia(createPinia())
})
```

### Q: 如何模拟定时器？
A: 使用 `vi.useFakeTimers()`：

```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})
```

## 📚 参考资源

- [Vitest 官方文档](https://vitest.dev/)
- [Vue Test Utils 指南](https://vue-test-utils.vuejs.org/)
- [Testing Library 文档](https://testing-library.com/docs/)
- [前端测试最佳实践](https://kentcdodds.com/blog/static-testing)

## 📞 支持

如有问题或建议，请：
1. 查看本文档
2. 搜索相关测试文件示例
3. 联系测试团队

---

**记住**：好的测试是产品质量的保障！🛡️
