from flask import Flask, render_template
app = Flask(__name__)

@app.route('/')
def default():
    return render_template('base.html')

@app.route('/index')
def index():
    passedDictionary={"fav_color":"fuscia", "fav_veg":"cauliflower","fav_fruit":"kiwi", "fav_animal":"toucan"}
    return render_template("index.html", user={"username":"maia"}, passedDictionary = passedDictionary, imgPath="img1.jpg")


@app.route('/pineParent')
def pineParent():
    return render_template("pineAppleParent.html")

@app.route('/about')
def about():
    return render_template("pineAppleChild.html", 
                           dataPassedA = "child A!")


app.run(debug=True)