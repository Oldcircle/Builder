const SEVERITY_ORDER = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const RULES = [
  {
    id: 'delete-recursive',
    severity: 'critical',
    description: 'Recursive delete or wipe',
    descriptionZh: '递归删除或清空',
    impacts: ['filesystem.delete'],
    alternatives: [
      {
        title: 'Use a dry run or list targets first',
        titleZh: '先 dry-run 或先列出目标',
      },
    ],
    patterns: [
      /\brm\s+-rf\b/i,
      /\bRemove-Item\b[^\n]*-Recurse/i,
      /\brmdir\s+\/s\b/i,
      /\bdel\s+\/s\b/i,
    ],
  },
  {
    id: 'format-disk',
    severity: 'critical',
    description: 'Disk or filesystem format',
    descriptionZh: '磁盘或文件系统格式化',
    impacts: ['filesystem.delete'],
    alternatives: [
      {
        title: 'Confirm the disk identifier and use read-only inspection first',
        titleZh: '确认磁盘标识，先只读检查',
      },
    ],
    patterns: [
      /\bmkfs\.[a-z0-9]+\b/i,
      /\bformat\s+[a-z]:/i,
      /\bFormat-Volume\b/i,
    ],
  },
  {
    id: 'raw-disk-write',
    severity: 'critical',
    description: 'Raw disk write or wipe',
    descriptionZh: '裸磁盘写入或擦除',
    impacts: ['filesystem.delete'],
    alternatives: [
      {
        title: 'Verify device path and use a non-destructive check first',
        titleZh: '核对设备路径，先做非破坏性检查',
      },
    ],
    patterns: [
      /\bdd\s+if=\/dev\//i,
      /\bDiskPart\b[^\n]*\bclean\b/i,
      /\bwipefs\b/i,
    ],
  },
  {
    id: 'download-exec',
    severity: 'high',
    description: 'Download and execute pipeline',
    descriptionZh: '下载并执行管道',
    impacts: ['network.download', 'process.exec', 'filesystem.write'],
    alternatives: [
      {
        title: 'Download to a file, review, then execute',
        titleZh: '先下载成文件，审查后再执行',
      },
      {
        title: 'Pin versions and verify checksums',
        titleZh: '固定版本并校验 checksum',
      },
    ],
    patterns: [
      /\bcurl\b[^\n]*\|\s*(sh|bash)\b/i,
      /\bwget\b[^\n]*\|\s*(sh|bash)\b/i,
      /\bInvoke-WebRequest\b[^\n]*\|\s*(iex|Invoke-Expression)\b/i,
      /\bIEX\s*\(/i,
      /\bpowershell\b[^\n]*-Command\b/i,
    ],
  },
  {
    id: 'autorun-schedule',
    severity: 'high',
    description: 'Persistent autorun or scheduled task',
    descriptionZh: '持久化自启动或计划任务',
    impacts: ['persistence.autorun'],
    alternatives: [
      {
        title: 'Use a temporary run or remove the task after debugging',
        titleZh: '改用临时运行，调试后移除任务',
      },
    ],
    patterns: [
      /\bschtasks\b[^\n]*\/create\b/i,
      /\bcrontab\b\s+-e\b/i,
      /\bLaunchAgents\b/i,
    ],
  },
  {
    id: 'registry-change',
    severity: 'high',
    description: 'Registry modifications',
    descriptionZh: '注册表修改',
    impacts: ['system.registry'],
    alternatives: [
      {
        title: 'Export the key first and apply minimal changes',
        titleZh: '先导出备份，再做最小改动',
      },
    ],
    patterns: [
      /\breg\s+(add|delete)\b/i,
      /\bSet-ItemProperty\b/i,
      /\bNew-ItemProperty\b/i,
    ],
  },
  {
    id: 'defender-firewall-disable',
    severity: 'high',
    description: 'Disable security protections',
    descriptionZh: '关闭安全防护',
    impacts: ['security.disable'],
    alternatives: [
      {
        title: 'Prefer scoped allowlists over disabling protection',
        titleZh: '优先做范围白名单，不要整体关闭防护',
      },
    ],
    patterns: [
      /\bSet-MpPreference\b[^\n]*DisableRealtimeMonitoring\b/i,
      /\bnetsh\b[^\n]*advfirewall\b[^\n]*state\s+off\b/i,
    ],
  },
  {
    id: 'privilege-change',
    severity: 'medium',
    description: 'Permission or ownership change',
    descriptionZh: '权限或所有权变更',
    impacts: ['filesystem.permission'],
    alternatives: [
      {
        title: 'Apply to a specific path and avoid recursive changes',
        titleZh: '限定到具体路径，避免递归修改',
      },
    ],
    patterns: [
      /\bchmod\b[^\n]*-R\b/i,
      /\bchown\b[^\n]*-R\b/i,
      /\bicacls\b[^\n]*\/grant\b/i,
    ],
  },
  {
    id: 'network-service',
    severity: 'medium',
    description: 'Expose or change network services',
    descriptionZh: '暴露或修改网络服务',
    impacts: ['network.expose'],
    alternatives: [
      {
        title: 'Restrict binding addresses and use SSH config files',
        titleZh: '限制绑定地址，使用 SSH 配置文件',
      },
    ],
    patterns: [
      /\bnetsh\b[^\n]*portproxy\b/i,
      /\bssh\b\s+-R\b/i,
      /\bssh\b\s+-L\b/i,
    ],
  },
  {
    id: 'shutdown-reboot',
    severity: 'low',
    description: 'Shutdown or reboot',
    descriptionZh: '关机或重启',
    impacts: ['system.power'],
    alternatives: [
      {
        title: 'Confirm timing and warn about data loss',
        titleZh: '确认时机并提示数据丢失风险',
      },
    ],
    patterns: [
      /\bshutdown\b/i,
      /\breboot\b/i,
      /\bhalt\b/i,
    ],
  },
];

module.exports = {
  RULES,
  SEVERITY_ORDER,
};
