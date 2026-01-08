/***
 * Clash Verge Rev override (Surge-style minimal groups)
 */

const enable = true

const groupBaseOption = {
  interval: 300,
  timeout: 2000,
  url: 'http://www.apple.com/library/test/success.html',
  lazy: true,
  'max-failed-times': 3,
  hidden: false,
}

// 智能策略(url-test)节点筛选关键字
const surgeSmartRegex =
  /(Hong\s*Kong|HK|Japan|JP|Singapore|SG|Taiwan|TW|United\s*States|US|美国|日本|新加坡|台湾)/i
// 流量信息节点筛选关键字
const surgeTrafficRegex = /(SSRDOG|XgCloud)/i
// 地区分组名称/匹配/图标
const surgeRegionDefs = [
  {
    name: '香港节点',
    regex: /(香港|Hong\s*Kong|HK)/i,
    icon: 'https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Rounded_Rectangle/Hong_Kong.png',
  },
  {
    name: '美国节点',
    regex: /(美国|United\s*States|US)/i,
    icon: 'https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Rounded_Rectangle/United_States.png',
  },
  {
    name: '日本节点',
    regex: /(日本|Japan|JP)/i,
    icon: 'https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Rounded_Rectangle/Japan.png',
  },
  {
    name: '台湾节点',
    regex: /(台湾|Taiwan|TW)/i,
    icon: 'https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Rounded_Rectangle/China.png',
  },
  {
    name: '新加坡节点',
    regex: /(新加坡|Singapore|SG)/i,
    icon: 'https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Rounded_Rectangle/Singapore.png',
  },
]

// 策略组图标与测速 URL
const serviceMeta = {
  流量信息:   { icon: 'https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Universal/Speedtest.png' },
  Proxy:     { icon: 'https://raw.githubusercontent.com/Irrucky/Tool/main/Surge/icon/surge_2.png' },
  ChatGPT:   { url: 'http://www.gstatic.com/generate_204', icon: 'https://raw.githubusercontent.com/lige47/QuanX-icon-rule/main/icon/chatgpt%28white%29.png' },
  智能策略:   { url: 'http://www.apple.com/library/test/success.html', icon: 'https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Universal/Airport.png' },
  手动选择:   { icon: 'https://raw.githubusercontent.com/Semporia/Hand-Painted-icon/master/Universal/Auto_Speed.png' },
  All:       { icon: 'https://raw.githubusercontent.com/lige47/QuanX-icon-rule/main/icon/quanqiu%282%29.png' },
}

// 远程规则集公共配置
const ruleProviderCommon = {
  type: 'http',
  format: 'text',
  interval: 86400,
}

function uniqueList(list) {
  const seen = new Set()
  const result = []
  for (const item of list) {
    if (item == null) continue
    if (!seen.has(item)) {
      seen.add(item)
      result.push(item)
    }
  }
  return result
}

function filterProxyNamesByRegex(proxyNames, regex) {
  if (!Array.isArray(proxyNames) || !regex) return []
  return proxyNames.filter((name) => regex.test(name))
}

function main(config) {
  if (!enable) return config

  config.proxies = config?.proxies || []
  if (!config.proxies.find((p) => p?.name === '直连')) {
    config.proxies.push({
      name: '直连',
      type: 'direct',
      udp: true,
    })
  }

  const allProxyNames = config.proxies.map((proxy) => proxy.name)
  const realProxyNames = allProxyNames.filter((name) => name !== '直连')
  const trafficProxyNames = filterProxyNamesByRegex(realProxyNames, surgeTrafficRegex)
  const manualProxyNames = realProxyNames.filter((name) => !surgeTrafficRegex.test(name))

  const regionProxyGroups = []
  const regionProxyNames = new Map()
  surgeRegionDefs.forEach((region) => {
    const proxies = filterProxyNamesByRegex(realProxyNames, region.regex)
    if (proxies.length === 0) return
    regionProxyNames.set(region.name, proxies)
    regionProxyGroups.push({
      ...groupBaseOption,
      name: region.name,
      type: 'select',
      proxies: proxies,
      icon: region.icon,
    })
  })

  const smartProxyNames = uniqueList(
    filterProxyNamesByRegex(realProxyNames, surgeSmartRegex)
  )
  const safeSmartProxyNames = smartProxyNames.length > 0 ? smartProxyNames : realProxyNames

  const chatgptProxyNames = uniqueList([
    ...(regionProxyNames.get('日本节点') || []),
    ...(regionProxyNames.get('美国节点') || []),
    ...(regionProxyNames.get('台湾节点') || []),
  ])
  const safeChatgptProxyNames =
    chatgptProxyNames.length > 0 ? chatgptProxyNames : safeSmartProxyNames

  config['proxy-groups'] = [
    {
      ...groupBaseOption,
      name: '流量信息',
      type: 'select',
      proxies: uniqueList([...trafficProxyNames]),
      icon: serviceMeta['流量信息'].icon,
    },
    {
      ...groupBaseOption,
      name: 'Proxy',
      type: 'select',
      proxies: ['智能策略', '手动选择', '直连'],
      icon: serviceMeta['Proxy'].icon,
    },
    {
      ...groupBaseOption,
      name: 'ChatGPT',
      type: 'url-test',
      url: serviceMeta['ChatGPT'].url,
      interval: 2400,
      tolerance: 80,
      proxies: safeChatgptProxyNames,
      icon: serviceMeta['ChatGPT'].icon,
    },
    {
      ...groupBaseOption,
      name: '智能策略',
      type: 'url-test',
      url: serviceMeta['智能策略'].url,
      proxies: safeSmartProxyNames,
      icon: serviceMeta['智能策略'].icon,
    },
    {
      ...groupBaseOption,
      name: '手动选择',
      type: 'select',
      proxies: uniqueList([...manualProxyNames, 'All']),
      icon: serviceMeta['手动选择'].icon,
    },
    ...regionProxyGroups,
    {
      ...groupBaseOption,
      name: 'All',
      type: 'select',
      proxies: realProxyNames,
      icon: serviceMeta['All'].icon,
    },
  ]

  config['rule-providers'] = {
    apple_intelligence: {
      ...ruleProviderCommon,
      behavior: 'classical',
      url: 'https://ruleset.skk.moe/List/non_ip/apple_intelligence.conf',
      path: './ruleset/skk/apple_intelligence.list',
    },
    ai: {
      ...ruleProviderCommon,
      behavior: 'classical',
      url: 'https://ruleset.skk.moe/List/non_ip/ai.conf',
      path: './ruleset/skk/ai.list',
    },
    blocked: {
      ...ruleProviderCommon,
      behavior: 'classical',
      url: 'https://github.com/Blankwonder/surge-list/raw/master/blocked.list',
      path: './ruleset/Blankwonder/blocked.list',
    },
    cn: {
      ...ruleProviderCommon,
      behavior: 'classical',
      url: 'https://github.com/Blankwonder/surge-list/raw/master/cn.list',
      path: './ruleset/Blankwonder/cn.list',
    },
    apple: {
      ...ruleProviderCommon,
      behavior: 'classical',
      url: 'https://github.com/Blankwonder/surge-list/raw/master/apple.list',
      path: './ruleset/Blankwonder/apple.list',
    },
  }

  config['rules'] = [
    'DOMAIN-KEYWORD,cttic,DIRECT',
    'DOMAIN,alpha123.uk,Proxy',
    'RULE-SET,apple_intelligence,ChatGPT',
    'RULE-SET,ai,ChatGPT',
    'RULE-SET,blocked,Proxy',
    'RULE-SET,cn,DIRECT',
    'DOMAIN,apps.apple.com,Proxy',
    'DOMAIN-SUFFIX,ls.apple.com,DIRECT',
    'DOMAIN-SUFFIX,store.apple.com,DIRECT',
    'RULE-SET,apple,Proxy',
    'DOMAIN-SUFFIX,doubleclick.net,REJECT',
    'DOMAIN-SUFFIX,googlesyndication.com,REJECT',
    'DOMAIN-SUFFIX,adsystem.com,REJECT',
    'GEOSITE,private,DIRECT',
    'GEOIP,private,DIRECT,no-resolve',
    'GEOIP,cn,DIRECT',
    'MATCH,Proxy',
  ]

  return config
}

