# CI / 制品 / npm 发布

## 1) GitHub Flow：自动构建制品（Artifacts）

仓库已添加 GitHub Actions：

- `CI`：在 `pull_request` 和 `push(main/master)` 时运行 `bun run check`，并生成一个可下载的 npm tarball（`*.tgz`）作为制品。
  - 说明：默认监听 `main` / `master` 两个分支的 push（兼容不同默认分支命名）。

你可以在 GitHub → **Actions** → 对应运行记录里下载 `npm-tarball`。

## 2) 发布到 npm（自动化）

仓库已添加 GitHub Actions：

- `Release`：当你 push 一个 tag（形如 `v0.1.0`）时：
  - 校验 tag 的版本号是否与 `package.json` 的 `version` 一致
  - 构建/测试
  - `bun publish` 发布到 npm
  - 同步生成 GitHub Release，并把 tarball 作为附件上传

### 2.1 需要配置的 Secret

在 GitHub 仓库设置里添加：

- `NPM_TOKEN`：你的 npm automation token（需要有 publish 权限）

### 2.2 发布流程（推荐）

1. 修改版本号（例如：`0.1.0` → `0.1.1`）
2. 提交到 `main`
3. 打 tag 并推送（tag 必须是 `v<version>`）

示例：

```bash
bun pm version patch
git push --follow-tags
```

## 3) 作为 OpenCode 插件安装（npm / bun）

发布到 npm 后，其他人可以直接安装这个包，然后用 CLI 把插件写入 OpenCode 配置目录。

### 3.1 全局安装（推荐：所有项目可用）

```bash
bun add -g opencode-novel
opencode-novel install --target=global
```

然后重启 OpenCode。

### 3.2 项目内安装（只对单个项目生效）

在你的小说工程目录：

```bash
bun add -D opencode-novel
bunx opencode-novel install --target=project
```

这会写入 `<project>/.opencode/...`，不会改动全局目录。

### 3.3 卸载

```bash
opencode-novel uninstall --target=global
```

或项目级：

```bash
bunx opencode-novel uninstall --target=project
```
