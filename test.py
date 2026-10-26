

def check_number(value):
    try:
        number = int(value)
    except ValueError:
        print("That wasn't a valid number")
    else:
        print("Conversion worked:", number)

    print("Continuing after the try/except/else")


# check_number("42")
check_number("hello")

