function validateName(name) {
    let parts = name.split(' ').filter(part => part != '');

    let result = parts.reduce((acc, part) => {
            if (!acc.ok) {
                    return acc;
            }

            let normPart = part.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

            if (!/[^a-z-]/.test(normPart)) {
                    acc.enteredName = acc.enteredName + ' ' + part;
                    acc.cleanedName = acc.cleanedName + normPart;
                    return acc;
            }

            return {
                    ok: false,
                    enteredName: '',
                    cleanedName: ''
            }

    }, {
            ok: true,
            enteredName: '',
            cleanedName: ''
    });

    if (result.ok) {
            result.cleanedName = result.cleanedName.slice(0,1).toUpperCase() 
            + result.cleanedName.slice(1,15);
    }

    return result;
}

const express = require("express");
const fs = require('fs');

const PORT = process.env.PORT || 3001;

const app = express();



app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/:name', (req, res) => {
    const result = validateName(req.params.name);

    if (!result.ok) {
        return res.json({error: 'Not a valid name.'});
    }

    let name = result.cleanedName,
    firstLetter = name.slice(0,1);

    let data, raw;

    if (name == "Random") {
        try {
            if (Math.random() <= 0.75) {
                raw = fs.readFileSync(__dirname + `/name_data/0/popular_names.json`);
            } else {
                raw = fs.readFileSync(__dirname + `/name_data/0/distinct_names.json`);
            }
            data = JSON.parse(raw);
            name = data[Math.floor(Math.random()*data.length)];
            firstLetter = name.slice(0,1);
            try {
                raw = fs.readFileSync(__dirname + `/name_data/${firstLetter}/${name}.json`);
                data = [name, JSON.parse(raw)];
            } catch {
                return res.json(false);
            }
            return res.json(data);
        } catch (err) {
            return res.json(false);
        }
    }

    if (name == "Totals") {
        try {
            raw = fs.readFileSync(__dirname + `/name_data/0/totals.json`);
            data = JSON.parse(raw)
            return res.json(data);
        } catch {
            return res.json(false);
        }
    }

    try {
        raw = fs.readFileSync(__dirname + `/name_data/${firstLetter}/${name}.json`);
        data = JSON.parse(raw);
    } catch (err) {
        data = false;
    }
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});