module.exports = {
    content: ["./public/**/*.html", "./app.js"],
    theme: {
        extend: {
        colors: {
            bg:"#FAF8F1", panel:"#FAEAB1", text:"#334443",
            muted:"#34656D", border:"#34656D", danger:"#b91c1c"
        },
        boxShadow:{ soft:"0 2px 6px rgba(51,68,67,.2)" },
        borderRadius:{ xl:"12px" }
        }
    },
    plugins: []
};
