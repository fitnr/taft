module.exports = {
    foo: function() {
        return 'hi';
    },
    debug: function(value) {
        if (value) console.error(value);
        else console.error(this);
    }
};
