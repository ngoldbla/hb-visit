module.exports = function(app, io){
    require('./visitor')(app,io)

    // WhatsApp module is optional - it requires Chromium and won't work on all platforms
    if (process.env.ENABLE_WHATSAPP === 'true') {
        try {
            require('./whatsapp')(app,io)
        } catch (error) {
            console.warn('WhatsApp module failed to load:', error.message)
        }
    } else {
        console.log('WhatsApp module disabled (set ENABLE_WHATSAPP=true to enable)')
    }

    require('./chat')(app,io)
    require('./page')(app,io)
    require('./login')(app,io)
    require('./guard')(app,io)
    require('./visit')(app,io)
}