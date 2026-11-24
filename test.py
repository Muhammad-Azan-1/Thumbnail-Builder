

# def check_number(value):
#     try:
#         number = int(value)
#     except ValueError:
#         print("That wasn't a valid number")
#     else:
#         print("Conversion worked:", number)

#     print("Continuing after the try/except/else")


# # check_number("42")
# check_number("hello")
# from urllib.parse import urlencode
# print(urlencode({'redirect' : '/dashboard'}))

# request = {"state" : "rate_limit_key" , "name" : "Azan"}
# cached = getattr(request,state, "rate_limit_key", None)

# # print(cached)

# identities = ['a' , 'b' , 'c' , 'c']
# print(dict.fromkeys(identities))
# for identity in dict.fromkeys(identities):
#     print(identity)


# found = {
#     ("route", "POST /api/v1/thumbnails/job"): {
#         "scope": "route",
#         "action": "POST /api/v1/thumbnails/job",
#         "expires_at": "2026-11-24T11:10:00+00:00",
#     },
#     ("application", "application"): {
#         "scope": "application",
#         "action": "application",
#         "expires_at": "2026-11-24T11:05:00+00:00",
#     },
# }


# print(sorted(found.values() , key=lambda items : (items['scope'] , items['action'])))



# dicts = {
#     'Huzaifa' : 2,
#     "Azan" : 1,
#     "Bilal" : 6
# }


# print(dict(sorted(dicts.items() , key=lambda i : i[1])))