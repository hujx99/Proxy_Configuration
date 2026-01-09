

### 🛠️ 问题总结：Docker 私有仓库 Push 失败排查

#### 1. 核心现象 (Symptom)

执行 `docker push` 时报错：

> `Get "https://registry.bingosoft.net/v2/": x509: certificate is valid for ingress.local, not registry.bingosoft.net`

#### 2. 根本原因 (Root Cause)

* **证书不匹配：** 目标服务器（通常是 K8s Ingress）返回的是默认的 `ingress.local` 证书，而你访问的是 `registry.bingosoft.net`。
* **Docker 安全策略：** Docker 默认只信任合法的 HTTPS 证书。发现“域名不符”后，为了安全会立即切断连接。
* **配置缺失：** 你的 `daemon.json` 中之前只有 `dns` 配置，没有将该仓库列入“非安全信任名单”。

#### 3. 解决步骤 (The Fix)

1. **修改配置：** 在 `/etc/docker/daemon.json` 中合并配置，添加 `insecure-registries` 字段。
```json
{
  "dns": ["10.15.0.254", "1.1.1.1"],
  "insecure-registries": ["registry.bingosoft.net"]
}

```


2. **强制生效：** 执行 `systemctl daemon-reload` 和 `systemctl restart docker`。
3. **验证：** 通过 `docker info` 确认 `Insecure Registries` 列表中出现了目标域名。

---

### 💡 避坑小贴士

* **JSON 格式：** 在 `daemon.json` 中增加项时，记得前一项末尾要加 **逗号**，否则 Docker 重启会报错。
* **端口匹配：** 如果将来镜像仓库地址带了端口（如 `registry.bingosoft.net:5000`），那么 `insecure-registries` 列表里也必须**带上端口**，否则依然会触发证书校验。
* **多机同步：** 如果你是在 openEuler 这种服务器环境操作，记得如果你换到 Mac 本机或另一台服务器，可能也需要同步这个配置。

既然 push 问题解决了，**需要我帮你写一个自动打标签并推送到这个私有仓库的 Shell 脚本，方便你以后一键处理 open-webui 的镜像更新吗？**
