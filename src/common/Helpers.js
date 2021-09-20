let sheet
let isHH
let isGH
let isCxH

class Helpers {
    static getHost() {
        return window.location.host
    }
    static getPathname() {
        return window.location.pathname
    }
    static isCurrentPage(matcher) {
        return Helpers.getPathname().includes(matcher)
    }

    static getSheet() {
        if (!sheet) {
            const style = document.createElement('style')
            document.head.appendChild(style);
            ({sheet} = style)
        }

        return sheet
    }

    static isHH() {
        if (isHH === undefined) {
            isHH = !(Helpers.isGH() || Helpers.isCxH())
        }
        return isHH
    }

    static isGH() {
        if (isGH === undefined) {
            isGH = [
                'www.gayharem.com',
                'nutaku.gayharem.com'
            ].includes(Helpers.getHost())
        }
        return isGH
    }

    static isCxH() {
        if (isCxH === undefined) {
            isCxH = [
                'www.comixharem.com',
                'nutaku.comixharem.com'
            ].includes(Helpers.getHost())
        }
        return isCxH
    }

    static $ (formattedHtml) {
        return window.$(formattedHtml.replace(/\n/g, '').replace(/ {4}/g, ''))
    }
}

export default Helpers
