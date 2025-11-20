#Library
import requests

# API key and city
api_key = 'b56f95070bbbb4a118e837f5ae1527d08e14d8e7'
city = 'Montreal'

# Correct URL for WAQI API (using city name)
url = f'https://api.waqi.info/search/?token={api_key}&keyword={city}'

# Make the request
response = requests.get(url)

# Get the response as json
data = response.json()

print(type(data))             # <class 'dict'>
print(data.keys())            # dict_keys(['status', 'data'])

responseData = data['data']
print(type(responseData))     # <class 'list'>
print(len(responseData))      # number of stations found [21]

#loop through the list of stations
for item in responseData:
    print(type(item))       # <class 'dict'>
    print(item.keys())      # dict_keys(['uid', 'aqi', 'station']) for each station found

# Get the station information
for item in responseData:
    print("Station name:", item['station']['name'])

# Station name: Montreal
# Station name: Échangeur Décarie, Montreal, Canada
# Station name: Roberval, York, Montreal, Canada
# Station name: Ontario, Montreal, Canada
# Station name: Caserne 17, Montreal, Canada
# Station name: Saint-Michel, Montreal, Canada
# Station name: Molson, Montreal, Canada
# Station name: Hochelaga-Maisonneuve, Montreal, Canada
# Station name: Parc Pilon, Montreal, Canada
# Station name: Maisonneuve, Montreal, Canada
# Station name: St-Dominique, Montreal, Canada
# Station name: Drummond, Montreal, Canada
# Station name: Jardin Botanique, Montreal, Canada
# Station name: Verdun, Montreal, Canada
# Station name: Duncan, Montreal, Canada
# Station name: Anjou, Montreal, Canada
# Station name: Dorval, Montreal, Canada
# Station name: Chénier, Montreal, Canada
# Station name: Saint-Jean-Baptiste, Montreal, Canada
# Station name: Aéroport de Montréal, Montreal, Canada
# Station name: Sainte-Anne-de-Bellevue, Montreal, Canada


#station name and geolocation
for item in responseData:
    lat, lon = item['station']['geo']
    print(f"Station: {item['station']['name']}")
    print(f"lat: {lat}")
    print(f"long: {lon}")
    print(f"AQI: {item['aqi']}")
    print(f"UID: {item['uid']}\n")

# Station: Montreal
# lat: 45.5086699
# long: -73.5539925
# AQI: 24
# UID: 5922

# Station: Échangeur Décarie, Montreal, Canada
# lat: 45.502648
# long: -73.663913
# AQI: 30
# UID: 8595

# Station: Roberval, York, Montreal, Canada
# lat: 45.464611
# long: -73.582583
# AQI: 30
# UID: 10716

# Station: Ontario, Montreal, Canada
# lat: 45.52055
# long: -73.563222
# AQI: 30
# UID: 8628

# Station: Caserne 17, Montreal, Canada
# lat: 45.593325
# long: -73.637328
# AQI: 30
# UID: 5461

# Station: Saint-Michel, Montreal, Canada
# lat: 45.563697
# long: -73.610447
# AQI: 27
# UID: 8696

# Station: Molson, Montreal, Canada
# lat: 45.542767
# long: -73.572039
# AQI: 24
# UID: 5467

# Station: Hochelaga-Maisonneuve, Montreal, Canada
# lat: 45.539928
# long: -73.540388
# AQI: 24
# UID: 5463

# Station: Parc Pilon, Montreal, Canada
# lat: 45.594576
# long: -73.641535
# AQI: 22
# UID: 8596

# Station: Maisonneuve, Montreal, Canada
# lat: 45.501531
# long: -73.574311
# AQI: 22
# UID: 5465

# Station: St-Dominique, Montreal, Canada
# lat: 45.512189
# long: -73.566842
# AQI: 21
# UID: 10138

# Station: Drummond, Montreal, Canada
# lat: 45.497859
# long: -73.573035
# AQI: 21
# UID: 8626

# Station: Jardin Botanique, Montreal, Canada
# lat: 45.56221
# long: -73.571785
# AQI: 17
# UID: 8695

# Station: Verdun, Montreal, Canada
# lat: 45.472854
# long: -73.57296
# AQI: 12
# UID: 8594

# Station: Duncan, Montreal, Canada
# lat: 45.4660102
# long: -73.6336838
# AQI: -
# UID: 5462

# Station: Anjou, Montreal, Canada
# lat: 45.602846
# long: -73.558874
# AQI: 27
# UID: 8625

# Station: Dorval, Montreal, Canada
# lat: 45.439119
# long: -73.7333
# AQI: -
# UID: 8627

# Station: Chénier, Montreal, Canada
# lat: 45.60176
# long: -73.541992
# AQI: 30
# UID: 5460

# Station: Saint-Jean-Baptiste, Montreal, Canada
# lat: 45.641026
# long: -73.499682
# AQI: 27
# UID: 5459

# Station: Aéroport de Montréal, Montreal, Canada
# lat: 45.468297
# long: -73.741185
# AQI: 24
# UID: 5466

# Station: Sainte-Anne-de-Bellevue, Montreal, Canada
# lat: 45.426509
# long: -73.928944
# AQI: 30
# UID: 5468


url_feed = "https://api.waqi.info/feed/@5468"
response_feed = requests.get(url_feed, params={"token": 'b56f95070bbbb4a118e837f5ae1527d08e14d8e7'})
results_feed = response_feed.json()
print(results_feed)
#{'status': 'ok', 'data': {'aqi': 30, 'idx': 5468, 'attributions': [{'url': 'http://ville.montreal.qc.ca/portal/page?_pageid=7237,74495616&_dad=portal&_schema=PORTAL', 'name': "Ville de Montreal - Réseau de surveillance de la qualité de l'air", 'logo': 'Canada-Montreal.png'}, {'url': 'https://waqi.info/', 'name': 'World Air Quality Index Project'}], 'city': {'geo': [45.426509, -73.928944], 'name': 'Sainte-Anne-de-Bellevue, Montreal, Canada', 'url': 'https://aqicn.org/city/canada/montreal/sainte-anne-de-bellevue', 'location': ''}, 'dominentpol': 'pm25', 'iaqi': {'co': {'v': 6.4}, 'h': {'v': 75.1}, 'no2': {'v': 7.4}, 'o3': {'v': 22}, 'p': {'v': 1013.6}, 'pm25': {'v': 30}, 'so2': {'v': 5.1}, 't': {'v': 19.1}, 'w': {'v': 1}, 'wg': {'v': 1.3}}, 'time': {'s': '2025-09-22 14:00:00', 'tz': '-04:00', 'v': 1758549600, 'iso': '2025-09-22T14:00:00-04:00'}, 'forecast': {'daily': {'pm10': [{'avg': 6, 'day': '2025-09-20', 'max': 6, 'min': 5}, {'avg': 11, 'day': '2025-09-21', 'max': 17, 'min': 6}, {'avg': 11, 'day': '2025-09-22', 'max': 13, 'min': 9}, {'avg': 12, 'day': '2025-09-23', 'max': 15, 'min': 9}, {'avg': 9, 'day': '2025-09-24', 'max': 17, 'min': 7}, {'avg': 6, 'day': '2025-09-25', 'max': 9, 'min': 4}, {'avg': 6, 'day': '2025-09-26', 'max': 9, 'min': 3}, {'avg': 11, 'day': '2025-09-27', 'max': 12, 'min': 8}], 'pm25': [{'avg': 13, 'day': '2025-09-20', 'max': 13, 'min': 12}, {'avg': 36, 'day': '2025-09-21', 'max': 53, 'min': 13}, {'avg': 34, 'day': '2025-09-22', 'max': 45, 'min': 28}, {'avg': 46, 'day': '2025-09-23', 'max': 53, 'min': 38}, {'avg': 30, 'day': '2025-09-24', 'max': 54, 'min': 22}, {'avg': 22, 'day': '2025-09-25', 'max': 28, 'min': 12}, {'avg': 21, 'day': '2025-09-26', 'max': 34, 'min': 9}, {'avg': 42, 'day': '2025-09-27', 'max': 47, 'min': 29}], 'uvi': [{'avg': 0, 'day': '2025-09-21', 'max': 0, 'min': 0}, {'avg': 0, 'day': '2025-09-22', 'max': 4, 'min': 0}, {'avg': 0, 'day': '2025-09-23', 'max': 2, 'min': 0}, {'avg': 1, 'day': '2025-09-24', 'max': 5, 'min': 0}, {'avg': 0, 'day': '2025-09-25', 'max': 2, 'min': 0}, {'avg': 0, 'day': '2025-09-26', 'max': 3, 'min': 0}]}}, 'debug': {'sync': '2025-09-23T04:53:02+09:00'}}}

# Get the data dictionary
response_data_feed = results_feed['data']
print(type(response_data_feed))    # <class 'dict'>
print(response_data_feed.keys())   # dict_keys(['aqi', 'idx', 'attributions', 'city', 'dominentpol', 'iaqi', 'time', 'forecast', 'debug'])

#loop through the data dictionary 
for item in response_data_feed:
    print(item)
#aqi
# idx
# attributions
# city
# dominentpol
# iaqi
# time
# forecast
# debug

# Get AQI and dominant pollutant

aqi_value = response_data_feed['aqi']
dominent_pol = response_data_feed['dominentpol']

print("AQI:", aqi_value)
print("Dominant pollutant:", dominent_pol)

# AQI: 30
# Dominant pollutant: pm25

# Get iaqi dictionary
iaqi_data = response_data_feed['iaqi']
print(type(iaqi_data))             # <class 'dict'>
print(iaqi_data.keys())            # dict_keys(['pm25', 'pm10', 'o3', 'no2', 'so2', ...])

# <class 'dict'>
# dict_keys(['co', 'h', 'no2', 'o3', 'p', 'pm25', 'so2', 't', 'w', 'wg'])

# Show pollutant values
for pollutant, value_dict in iaqi_data.items():
    print(pollutant, ":", value_dict['v'])

# co : 6.4
# h : 75.1
# no2 : 7.4
# o3 : 22
# p : 1013.6
# pm25 : 30
# so2 : 5.1
# t : 19.1
# w : 1
# wg : 1.3

# Show dominant pollutant value
dominant_value = iaqi_data[dominent_pol]['v']
print(f"Dominant pollutant ({dominent_pol}) value: {dominant_value}") # pm25: 30

# Dominant pollutant (pm25) value: 30


#Part 7- for getting the information for another city you can either change the city variable at the top of the script or change the uid in the url_feed variable to the uid of another station found in the search results.