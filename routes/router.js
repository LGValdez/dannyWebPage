if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripe = require('stripe')(stripeSecretKey)

const express = require('express')
const router = express.Router()
const fs = require('fs')

router.get('/', (req, res) => {
    res.render('index', {
        title: 'Home'
    })
})

router.get('/danny', (req, res) => {
    res.render('danny', {
        title: 'About'
    })
})

router.get('/store', function(req, res) {
    fs.readFile('items.json', function(error, data) {
        if (error) {
            res.status(500).end()
        } else {
            res.render('store.ejs', {
                title: 'Store',
                stripePublicKey: stripePublicKey,
                items: JSON.parse(data)
            })
        }
    })
})

router.post('/purchase', function(req, res) {
    fs.readFile('items.json', function(error, data) {
        if (error) {
            res.status(500).end()
        } else {
            const itemsJson = JSON.parse(data)
            const itemsArray = itemsJson.music.concat(itemsJson.merch)
            let itemsList = []
            req.body.items.forEach(element => {
                const itemJson = itemsArray.find(i => {
                    return i.id == element.id
                })
                itemsList.push({
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': itemJson.name,
                        },
                        'unit_amount': itemJson.price
                    },
                    'quantity': element.quantity
                })
            })
            stripe.checkout.sessions.create({
                'payment_method_types': ['card'],
                'line_items': itemsList,
                'mode': 'payment',
                'success_url': process.env.BASE_URL,
                'cancel_url': process.env.BASE_URL + '/store',
            }).then(session => {
                res.json({'session_id': session.id})
            })
        }
    })
})

module.exports = router
