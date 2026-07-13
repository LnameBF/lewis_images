import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { normalizeDevProxyConfig } from './src/lib/devProxy'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

function loadDevProxyConfig() {
  try {
    return normalizeDevProxyConfig(
      JSON.parse(readFileSync('./dev-proxy.config.json', 'utf-8')) as unknown,
    )
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') return null
    throw error
  }
}

export default defineConfig(({ command, mode }) => {
  const devProxyConfig = command === 'serve' && mode !== 'test' ? loadDevProxyConfig() : null

  return {
    plugins: [react()],
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __DEV_PROXY_CONFIG__: JSON.stringify(devProxyConfig),
    },
    server: {
      host: true,
      proxy: {
        // 静态兜底代理：把 /api-proxy 转发到远程开发服务器，规避浏览器跨域。
        // 前端需开启「API 代理」开关（见 SettingsModal），请求才会走 /api-proxy 前缀。
        // rewrite 同时去掉 /api-proxy 与前导 /v1，最终请求为 http://http://1.14.75.7:41446/<原始路径>
        '/api-proxy': {
          target: 'http://1.14.75.7:41446',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api-proxy/, '').replace(/^\/v1/, ''),
        },
        // 若 dev-proxy.config.json 启用且前缀不同，则额外叠加其代理规则
        ...(devProxyConfig?.enabled && devProxyConfig.prefix !== '/api-proxy'
          ? {
              [devProxyConfig.prefix]: {
                target: devProxyConfig.target,
                changeOrigin: devProxyConfig.changeOrigin,
                secure: devProxyConfig.secure,
                rewrite: (path) =>
                  path.replace(
                    new RegExp(`^${devProxyConfig.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
                    '',
                  ),
              },
            }
          : {}),
      },
    },
  }
})
