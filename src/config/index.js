import Helpers from '../common/Helpers'
import { colors, lsKeys } from '../common/Constants'
const {$} = Helpers

const CONFIG_SEP = '_'

class Config {
    constructor() {
        this.groups = []
        this.modules = []
        this.config = {}
        this.hasRendered = false
        this.$configButton = null
        this.$configPane = null
        this.configPaneOpen = false
        this.colors = colors[Helpers.getGameKey()]

        if (Helpers.isCurrentPage('home')) {
            this.init()
            this.renderInteractables()
        }
    }

    init() {
        this.gameIcon = $('.hh_logo>img').attr('src')
        this.gameTitle = $('.hh_logo').attr('title')
    }

    loadConfig () {
        const config = Helpers.lsGet(lsKeys.CONFIG)
        if (config) {
            Object.assign(this.config, (config))
        }
    }

    saveConfig () {
        Helpers.lsSet(lsKeys.CONFIG, this.config)
    }

    updateConfig (key, value) {
        this.config[key] = value
        this.saveConfig()

        const {module, subKey} = this.getModuleForKey(key)
        if (module) {
            if (subKey) {
                if (typeof module.updateSubSetting === 'function') {
                    module.updateSubSetting(subKey, value)
                }
            } else {
                const $setting = this.$configPane.find(`.config-setting[rel=${key}]`)
                const $subSettings = $setting.find('.sub-settings input')
                if (value) {
                    this.runModule(module)
                    $setting.addClass('enabled')
                    $subSettings.prop('disabled', false)
                } else {
                    if (typeof module.tearDown === 'function') {
                        module.tearDown()
                    }
                    $setting.removeClass('enabled')
                    $subSettings.prop('disabled', true)
                }
            }
        }
    }

    registerGroup(group) {
        const {name, key} = group
        if (!name || !key) {
            throw new Error('cannot register invalid group, need both "key" and "name"', group)
        }

        this.groups.push(group)
    }

    registerModule(module) {
        const {group, configSchema} = module

        if (!group || !this.groups.find(({key}) => key === group)) {
            throw new Error(`cannot register module with unknown group ${group}`)
        }

        this.modules.push(module)

        this.config[this.getConfigKey(group, configSchema.baseKey)] = configSchema.default
        if (configSchema.subSettings) {
            configSchema.subSettings.forEach(setting => {
                this.config[this.getConfigKey(group, configSchema.baseKey, setting.key)] = setting.default
            })
        }
    }

    runModules () {
        this.modules.forEach(module => {
            const moduleEnabled = this.config[this.getConfigKey(module.group, module.configSchema.baseKey)]
            if (moduleEnabled) {
                this.runModule(module)
            }
        })
    }

    runModule(module) {
        const subSettings = Object.keys(this.config)
            .filter(key => key.startsWith(`${this.getConfigKey(module.group, module.configSchema.baseKey)}${CONFIG_SEP}`))
            .map(key => ({ [key.replace(`${this.getConfigKey(module.group, module.configSchema.baseKey)}${CONFIG_SEP}`, '')]: this.config[key] }))
            .reduce((a, b) => Object.assign(a, b), {})
        module.run(subSettings)
    }

    getConfigKey (group, baseKey, subKey) {
        return [group, baseKey, subKey].filter(k=>k).join(CONFIG_SEP)
    }

    getModuleForKey (key) {
        const [kGroup, baseKey, subKey] = key.split(CONFIG_SEP)
        const module = this.modules.find(({group, configSchema}) => configSchema.baseKey === baseKey && group === kGroup)

        return {
            module,
            subKey
        }
    }

    renderInteractables () {
        if (this.hasRendered) {
            return
        }

        this.injectCSS()

        // $(document).ready
        this.renderConfigButton()
        // this.renderConfigPane()
        // this.setupEvents()

        this.hasRendered = true
    }

    renderConfigButton () {
        this.$configButton = $(`<div class="hh-plus-plus-config-button" hh_title="${this.gameTitle} ++"></div>`)
        this.$configButton.click(this.openConfigPane.bind(this))
        $('#contains_all').append(this.$configButton)
    }

    buildConfigPaneContent () {
        return $(`
            <div class="tabs">
                ${this.groups.map(({key, name}) => `<h4 class="${key}" rel="${key}">${name}</h4>`).join('')}
            </div>
            ${this.groups.map(({key: groupKey}) => `
            <div class="group-panel" rel="${groupKey}">
                <div class="panel-contents">
                    ${this.modules.filter(({group}) => group === groupKey).map(({configSchema}) => {
        const baseKey = this.getConfigKey(groupKey, configSchema.baseKey)
        const baseVal = this.config[baseKey]
        return `
                <div class="config-setting ${baseVal ? 'enabled' : ''} ${configSchema.subSettings ? 'has-subsettings' : ''}" rel="${baseKey}">
                    <label class="base-setting">
                        <span>${configSchema.label}</span>
                        <input type="checkbox" name="${baseKey}" ${baseVal ? 'checked="checked"' : ''} />
                    </label>
                    ${configSchema.subSettings ? `
                    <div class="sub-settings">
                        ${configSchema.subSettings.map(subSetting => {
        const subKey = this.getConfigKey(groupKey, configSchema.baseKey, subSetting.key)
        const subVal = this.config[subKey]
        return `
                        <label>
                            <input type="checkbox" name="${subKey}" ${subVal ? 'checked="checked"' : ''} ${baseVal ? '' : 'disabled="disabled"'} />
                            <span>${subSetting.label}</span>
                        </label>`
    }).join('')}
                    </div>` : ''}
                </div>`
    }).join('')}
                </div>
            </div>`
    ).join('')}`
        )
    }

    renderConfigPane () {
        const $closePaneButton = $('<span class="close-config-panel" />')
        $closePaneButton.click(this.closeConfigPane.bind(this))

        this.$configPane = $('<div class="hh-plus-plus-config-panel"></div>')
            .append(this.buildConfigPaneContent())
            .prepend($closePaneButton)
        $('#contains_all').append(this.$configPane)
        this.setupEvents()
        this.selectConfigTab(this.groups[0].key)
    }

    closeConfigPane () {
        if (!this.$configPane.hasClass('shown')) {
            return
        }
        this.$configPane.removeClass('shown')
        this.configPaneOpen = false
    }

    openConfigPane () {
        if (this.$configPane && this.$configPane.hasClass('shown')) {
            return
        }
        if (!this.$configPane) {
            // rendering lazily here so that all modules should have been registered at this point
            this.renderConfigPane()
        }
        this.$configPane.addClass('shown')
        this.configPaneOpen = true
    }

    selectConfigTab(key) {
        $('.hh-plus-plus-config-panel .tabs h4').removeClass('selected')
        $(`.hh-plus-plus-config-panel .tabs h4[rel=${key}]`).addClass('selected')
        $('.hh-plus-plus-config-panel .group-panel').removeClass('shown')
        $(`.hh-plus-plus-config-panel .group-panel[rel=${key}]`).addClass('shown')
    }

    setupEvents () {
        this.groups.forEach(({key}) => {
            $(`.hh-plus-plus-config-panel .tabs h4[rel=${key}]`).click(this.selectConfigTab.bind(this, key))
        })
        Object.keys(this.config).forEach(key => {
            $(`.hh-plus-plus-config-panel input[name=${key}]`).change((e) => {
                this.updateConfig(key, $(e.target).prop('checked'))
            })
        })
    }

    injectCSS () {
        const sheet = Helpers.getSheet()

        sheet.insertRule(`
            .hh-plus-plus-config-button {
                position: absolute;
                right: 15px;
                cursor: pointer;
                background: url(${this.gameIcon});
                background-size: contain;
            }
        `)
        sheet.insertRule(Helpers.mediaDesktop(`
            .hh-plus-plus-config-button {
                height: 35px;
                width: 35px;
                top: 46px;
            }
            `))
        sheet.insertRule(Helpers.mediaMobile(`
            .hh-plus-plus-config-button {
                height: 64px;
                width: 64px;
                top: 85px;
            }
        `))
        sheet.insertRule(`
            .hh-plus-plus-config-button:after {
                content: "++";
                position: absolute;
                width: auto;
                bottom: -3px;
                right: -5px;
                text-shadow: rgb(0 0 0) 1px 1px 0px, rgb(0 0 0) -1px 1px 0px, rgb(0 0 0) -1px -1px 0px, rgb(0 0 0) 1px -1px 0px;
            }
        `)
        sheet.insertRule(Helpers.mediaDesktop(`
            .hh-plus-plus-config-button:after {
                font-size: 26px;
                height: 20px;
                line-height: 20px;
            }
        `))
        sheet.insertRule(Helpers.mediaMobile(`
            .hh-plus-plus-config-button:after {
                font-size: 46px;
                height: 40px;
                line-height: 46px;
            }
        `))

        // (1026 - 900) / 2 = 63
        sheet.insertRule(`
            .hh-plus-plus-config-panel {
                display: none;
                height: 470px;
                width: 900px;
                position: absolute;
                top: 70px;
                right: 63px;
                background: ${this.colors.panelBackground};
                z-index: 100;
                border-style: solid;
                border-image-slice: 1;
                border-width: 4px;
                border-image-source: ${this.colors.panelBorderGradient};
                box-shadow: ${this.colors.panelInset};
            }
        `)

        sheet.insertRule(`
            .hh-plus-plus-config-panel.shown {
                display: block;
            }
        `)
        sheet.insertRule(`
            .close-config-panel {
                position: absolute;
                display: block;
                background: url(${Helpers.getCDNHost()}/clubs/ic_xCross.png);
                background-size: cover;
                height: 37px;
                width: 41px;
                top: 6px;
                right: 6px;
                cursor: pointer;
            }
        `)

        sheet.insertRule(`
            .hh-plus-plus-config-panel .group-panel {
                display: none;
                position: absolute;
                top: 54px;
                width: 889px;
                height: 405px;
            }
        `)
        sheet.insertRule(`
            .hh-plus-plus-config-panel .group-panel .panel-contents {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
                width: 100%;
                height: auto;
                padding-left: 10px;
                padding-right: 10px;
                gap: 10px;
            }
        `)
        sheet.insertRule(`
            .hh-plus-plus-config-panel .group-panel.shown {
                display: block;
            }
        `)

        sheet.insertRule(`
            .hh-plus-plus-config-panel .config-setting {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
                border-radius: 6px;
                border: 1px solid #aaa;
                background: ${this.colors.homeDark};
                padding: 7px;
                font-size: 14px;
            }
        `)
        sheet.insertRule(`
            .hh-plus-plus-config-panel .config-setting.has-subsettings {
                grid-row-end: span 2;
            }
        `)
        sheet.insertRule(`
            .hh-plus-plus-config-panel .config-setting.enabled {
                border: 1px solid ${this.colors.homeBorder};
            }
        `)

        sheet.insertRule(`
            .hh-plus-plus-config-panel .base-setting {
                display: flex;
            }
        `)
        sheet.insertRule(`
            .hh-plus-plus-config-panel .base-setting span {
                flex: 1;
            }
        `)
        sheet.insertRule(`
            .hh-plus-plus-config-panel .sub-settings {
                font-size: 12px;
                margin-top: 8px;
            }
        `)
        sheet.insertRule(`
            .hh-plus-plus-config-panel .sub-settings label {
                display: flex;
                align-items: center;
            }
        `)
        sheet.insertRule(`
            .hh-plus-plus-config-panel .sub-settings label span {
                flex: 1;
            }
        `)
        sheet.insertRule(`
            .hh-plus-plus-config-panel .sub-settings label input {
                margin-left: 0;
            }
        `)
        sheet.insertRule(`
            .hh-plus-plus-config-panel .sub-settings label input[disabled] {
                background-color: initial;
                box-shadow: unset;
                -webkit-box-shadow: unset;
            }
        `)
    }
}

export default Config
