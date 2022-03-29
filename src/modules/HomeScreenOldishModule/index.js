import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'homeScreenOldish'

class HomeScreenOldishModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: false
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('home')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.prepClasses()
        })

        this.hasRun = true
    }

    prepClasses () {
        $('.quest-container:has([rel=map])').addClass('position-quest')

        let $sexGodPath = $('.quest-container:has([rel=sex-god-path])')
        if (!$sexGodPath.length) {
            $sexGodPath = $('[rel=sex-god-path]')
        }
        $sexGodPath.addClass('position-sex-god-path')

        let $clubs = $('.quest-container:has([rel=clubs])')
        if (!$clubs.length) {
            $clubs = $('[rel=clubs]')
        }
        $clubs.addClass('position-clubs')
    }
}

export default HomeScreenOldishModule