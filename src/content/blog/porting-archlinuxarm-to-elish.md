---
title: 'Porting ArchlinuxARM 到 elish 记录'
description: 'Porting ArchlinuxARM 到 elish 记录'
pubDate: '2024-06-27 03:38:03'
heroImage: '/blog-placeholder-1.jpg'
---

## Kupfer

本文所指的 ArchlinuxARM 为 Kupfer Mobile Linux，这是一个基于 ArchlinuxARM 的 Linux 发行版。借助 Kupferbootstrap 工具，我们可以制作出适配自己手中移动设备的 ArchlinuxARM 镜像。

## TLDR

了解 Kupfer 之前，我们先来认识一下 Postmarket OS，它同样是一个主要关注移动设备的 Linux 发行版，经过社区多年的发展已经可以在很多手机、平板、开发板上运行，。Postmarket OS 为社区提供了丰富经验和文档，催生出了一些衍生项目，本文所指就是其中之一。

Kupfer 与 pmOS 高度相关，设备固件与内核等关键系统组件的构建与 pmOS 类似，如果你了解过 Postmarket OS 应该有一个大概的印象。Postmarket OS 有一个设备兼容性列表，你可以查看一下[你的设备支持情况](https://wiki.postmarketos.org/wiki/Devices)，如果兼容性满足你的需求，你基本就可以动手构建出你的 Kupfer 镜像。

## 前置条件

你需要一个能运行 pmOS 的设备，以我手中的小米平板 5 Pro 为例，这是[Postmarket OS 设备详情页](<https://wiki.postmarketos.org/wiki/Xiaomi_Mi_Pad_5_Pro_(xiaomi-elish)>)，里面介绍了现阶段 pmOS 的兼容情况。

## 准备工作

1. Linux 环境、Docker (可选)
2. python3 环境
3. 小米平板 5 Pro (elish)

## kupferbootstrap 基本使用

这是一个工具集，可以用来构建 Kupfer Mobile Linux 的软件包和镜像。

### 安装

参考[https://kupfer.gitlab.io/kupferbootstrap/main/install/](https://kupfer.gitlab.io/kupferbootstrap/main/install/)

1. 首先需要 clone kupferbootstrap 到你的工作目录

```shell
$ git clone --depth=1 -b dev https://gitlab.com/kupfer/kupferbootstrap kupferbootstrap
```

2. 切换到 kupferbootstrap 目录，安装依赖

```shell
$ python3 -m venv venv
$ . ./venv/bin/activate
$ pip install -r requirements.txt
```

### 编写配置文件

我们可以使用 `kupferbootstrap config init -N` 由模板产生一个默认的配置文件，位于 `$HOME/kupfer/kupferbootstrap.toml`，打开文件，可以看到类似下面的结构：

```toml
[wrapper]
type = "none" # docker: 使用 docker 构建镜像 | none: 使用宿主机，要求宿主机为 archlinux

[build]
......

[pkgbuilds]
git_repo = "https://gitlab.com/kupfer/packages/pkgbuilds.git"   # PKGBUILD 的仓库地址
git_branch = "dev" # 分支

[pacman]
......

[paths]
......

[profiles]
current = "default"

[profiles.default]
parent = ""
device = "sm8250-xiaomi-elish-boe" # 设备名
flavour = "gnome" # 衍生版本
pkgs_include = ["vim", "git", "chromium"] # 需要安装到镜像的软件包
pkgs_exclude = [] # 需要排除的软件包
hostname = "elish" # 主机名
username = "elish" # 默认用户名
password = "elish" # 密码
size_extra_mb = "0"
```

示例中为关键参数写明了注释，可以根据自己的设备修改，这些参数的作用后面再具体介绍。

## 目录结构

根据配置文件，执行构建后会将仓库 clone 到本地，位于 $HOME/.cache/kupfer 目录下：

```
.
├── ccache
├── chroots
├── images
├── packages
├── pacman
└── pkgbuilds
```

其中 pkgbuilds 是根据配置文件 clone 下来的，我们也可以在构建前访问看一下它内部的结构 [https://gitlab.com/kupfer/packages/pkgbuilds](https://gitlab.com/kupfer/packages/pkgbuilds)。

我们主要关注的目录就是 pkgbuilds、chroots、images。chroots 是构建镜像临时使用的，构建过程需要 chroot 进去安装软件，这里也包含了一些交叉编译所需要的环境和工具，images 是构建镜像产物目录。

进入 pkgbuilds，可以看到几个文件夹和 repos.yml 文件，其中 repos.yml 定义了每个仓库的地址和 PKGBUILD 选项，而每个文件夹对应此文件写明的仓库。

你可以自行创建 PKGBUILD 来自定义你的镜像，以添加 Plasma Desktop 为例 [https://gitlab.com/jianhua000/pkgbuilds/-/tree/elish/main/flavour-plasma-desktop](https://gitlab.com/jianhua000/pkgbuilds/-/tree/elish/main/flavour-plasma-desktop)，新建了一个文件夹与包名对应，然后添加你的 PKGBUILD。

在本文成文时，如果你也想构建一个以 KDE 为桌面环境的镜像，你还需要做一些修改：打开 PKGBUILD,你会看一个依赖 `plasma-wayland-session`，把它改成 `plasma-workspace`，KDE 已经将这个依赖删掉了。

## 添加软件包

如果你想添加官方没有的软件包（软件默认会在 Chroot 后通过远程仓库下载安装），一个简单方法就是从 aur clone。举个例子，我想要我的镜像默认安装好 paru，我做的步骤就是 cd 进入 main 文件夹，然后 `git clone https://aur.archlinux.org/paru-bin.git --depth=1`，之后打开 PKGBUILD 文件，在头部添加

```
# paru-bin 的 PKGBUILD 文件
_mode=cross
pkgname=paru-bin
...
```

\_mode 可以写 cross 或者 host，据我观察应该是代表了安装到镜像 (cross) 或者本机 (host)，这个字段不写的话会给警告。

## 添加设备相关依赖

设备相关的依赖有 firmware (固件和驱动文件)、kernel (Linux 内核)、device (设备描述文件)，他们分别有自己的文件夹，其中 [firmware](https://gitlab.com/postmarketOS/pmaports/-/blob/master/device/testing/firmware-xiaomi-elish/APKBUILD?ref_type=heads) 和 [device](https://gitlab.com/postmarketOS/pmaports/-/tree/master/device/testing/device-xiaomi-elish?ref_type=heads) 可以在 postmarket 的仓库中获取到，我们只需要 device 中的 `deviceinfo` 文件、以及一个 [PKGBUILD](https://gitlab.com/jianhua000/pkgbuilds/-/blob/elish/device/device-sm8250-xiaomi-elish/PKGBUILD?ref_type=heads)，当然 postmarket 提供的是 APKBUILD，所以我们还是之间抄[这个仓库](https://gitlab.com/jianhua000/pkgbuilds)作业吧。kernel 也类似，这个仓库也提供了 linux-sm8250 的案例，在 linux 目录可以看到相关内容。

## 构建

构建镜像使用命令 `kupferbootstrap image build`。如果配置文件的 type 设置为 none，那么构建依赖都会装到你的主机上面，以你的主机 archlinux 构建镜像，如果是 docker 则使用 docker 构建。

构建时间取决于你的电脑性能，以我的 5600H 大概只需要十多分钟，因为大部分包是不需要编译的，直接从远程仓库安装，比较耗时的基本只有 kernel。

## 刷入设备

构建出的镜像会放到 images 文件夹，有三个镜像 `sm8250-xiaomi-elish-boe-plasma-desktop-boot.img`、`sm8250-xiaomi-elish-boe-plasma-desktop-full.img`、`sm8250-xiaomi-elish-boe-plasma-desktop-root.img`，我们可以将 root 或 full 镜像刷入 super 分区，或者切割出来的新分区，从 data 分区切割一块给 linux 使用，方法可以参考这个 [wiki](https://github.com/amazingfate/armbian-xiaomi-elish/wiki/Flashing-Guide#flash-images)，而 boot 镜像不是标准的 aboot 镜像，我们需要挂载它将 aboot.img 提取出来，或者使用 `debugfs sm8250-xiaomi-elish-boe-plasma-desktop-boot.img -R 'dump /aboot.img ./aboot.img'`。

将两个镜像刷入对应的分区后就可以尝试开机了。

![运行 WPS for Linux](/alarm.png)

## 关于参数

device: 设备名应与 provide 的包名对应

```
_mode=cross
_nodeps=true
pkgbase=device-sm8250-xiaomi-elish
pkgname=(
    device-sm8250-xiaomi-elish-common
    device-sm8250-xiaomi-elish-boe # 小米平板 5 Pro BOE 屏
    device-sm8250-xiaomi-elish-csot
)
```

flavour: 你可以在 main 目录找到一些以 flavour 为前缀的包，这个选项可选值由这个决定。

## 参考链接

[ttps://kupfer.gitlab.io/](https://kupfer.gitlab.io/)

[https://xunflash.top/archives/porting_2_kupfer.html](https://xunflash.top/archives/porting_2_kupfer.html)

[https://gitlab.com/kupfer/packages/pkgbuilds/](https://gitlab.com/kupfer/packages/pkgbuilds/)

[https://gitlab.com/jianhua000/pkgbuilds/](https://gitlab.com/jianhua000/pkgbuilds/)

[https://wiki.postmarketos.org/wiki/Devices](https://wiki.postmarketos.org/wiki/Devices)
