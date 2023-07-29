import { app } from 'electron'
import regedit from 'regedit'
import { v5 as uuidv5 } from 'uuid'

const reg = regedit.promisified

const appName = app.getName()
const exePath = app.getPath('exe')

const ELECTRON_BUILDER_NS_UUID = "50e065bc-3134-11e6-9bab-38c9862bdaf3";
const options = {
  guid: `{${uuidv5("org.sky.electron-vite-template", ELECTRON_BUILDER_NS_UUID)}}`,
  name: appName, // 显示名
  infoTip: '双击运行' + appName, // 鼠标移入显示
  localizedString: appName, // 本地化显示名
  itemAuthors: '双击运行' + appName, // 显示名下描述
  iconPath: exePath, // exe / ico
  exe: exePath, // 双击打开
}
// 在设备和驱动器占位
// HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\MyComputer\NameSpace\{guid}
const nameSpacePath = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\MyComputer\\NameSpace"
const appInNameSpacePath = nameSpacePath + "\\" + options.guid

// 配置设备和驱动器信息
// HKEY_CURRENT_USER\Software\Classes\CLSID\{guid}
const clsidPath = "HKCU\\Software\\Classes\\CLSID"
const appInClsidPath = clsidPath + "\\" + options.guid

// Shell
const appInClsidShell = appInClsidPath + '\\Shell'
// Shell\\Open
const appInClsidShellOpen = appInClsidShell + '\\Open'
// Shell\\Open\\Command
const appInClsidShellOpenCommand = appInClsidShellOpen + '\\Command'

// 设置图标
const appInClsidDefaultIconPath = appInClsidPath + '\\DefaultIcon'

export async function showOnMyComputer() {
  if (!await checkExists(appInNameSpacePath)) {
    await reg.createKey([appInNameSpacePath])
  }
  // 修改默认值
  await reg.putValue({
    [appInNameSpacePath]: {
      default: {
        value: options.name,
        type: 'REG_DEFAULT'
      }
    }
  })
 
  if (!await checkExists(appInClsidPath)) {
    await reg.createKey([appInClsidPath])
  }
  // 修改默认值
  await reg.putValue({
    [appInClsidPath]: {
      default: {
        value: options.name,
        type: 'REG_DEFAULT'
      },
      InfoTip: {
        value: options.infoTip,
        type: 'REG_SZ'
      },
      LocalizedString: {
        value: options.localizedString,
        type: 'REG_SZ'
      },
      'System.ItemAuthors': {
        value: options.itemAuthors,
        type: 'REG_SZ'
      },
      TileInfo: {
        value: 'prop:System.ItemAuthors',
        type: 'REG_SZ'
      }
    }
  })
 
  if (!await checkExists(appInClsidDefaultIconPath)) {
    await reg.createKey([appInClsidDefaultIconPath])
  }
  await reg.putValue({
    [appInClsidDefaultIconPath]: {
      Icon: {
        value: options.iconPath,
        type: 'REG_DEFAULT'
      }
    }
  })
  // // InprocServer32 注册 32 位进程内服务器，并指定服务器可以在其中运行的单元的线程模型。
  // const appInClsidInprocServer32 = appInClsidPath + '\\InprocServer32'
  // if (!await checkExists(appInClsidInprocServer32)) {
  //   await reg.createKey([appInClsidInprocServer32])
  // }
  // await reg.putValue({
  //   [appInClsidInprocServer32]: {
  //     default: {
  //       value: '%SystemRoot%\system32\shdocvw.dll',
  //       type: 'REG_DEFAULT'
  //     },
  //     ThreadingModel: {
  //       value: 'Apartment',
  //       type: 'REG_SZ'
  //     }
  //   }
  // })
  
  
  if (!await checkExists(appInClsidShell)) {
    await reg.createKey([appInClsidShell])
  }
  if (!await checkExists(appInClsidShellOpen)) {
    await reg.createKey([appInClsidShellOpen])
  }
  if (!await checkExists(appInClsidShellOpenCommand)) {
    await reg.createKey([appInClsidShellOpenCommand])
  }
  await reg.putValue({
    [appInClsidShellOpenCommand]: {
      default: {
        value: options.exe,
        type: 'REG_DEFAULT'
      }
    }
  })
}

export async function hideOnMyComputer() {
  await rmrf(appInNameSpacePath)
  await rmrf(appInClsidPath)
}

export async function checkIsShowOnMyComputer() {
  return await checkExists(appInNameSpacePath)
}

async function checkExists(key: string) {
  return (await reg.list([key]))[key].exists
}

async function rmrf(key: string) {
  const data = (await reg.list([key]))[key]
  if (data.exists) {
    for (let i = 0; i < data.keys.length; i++) {
      await rmrf(key + "\\" + data.keys[i])
    }
    await reg.deleteKey([key])
  }
}