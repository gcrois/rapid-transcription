# Rapid Image Transcription Zone

RITZ is a client-only website which enables rapid transcription of inserted images.

# Usage

First, a user must insert their desired images. They can do this by click on the upload column in the right hand side of the screen or by draggning a collection of files into the upload column.

One the images are in RITZ, the user may select an image on the right hand column or use the arrow keys to navigate.

To label an image, type in the "Enter a classification" input box at the bottom of the screen. Labels are generally space delimited.

To delete a space delimited label, deselect the input box and press the backspace button.

To apply and go to the next image, press the enter button.

Once you are done transcribing, click the `Results` tab in the site header to download a `.json` file detailing your classifications.

RITZ is available for use at https://utk-pairs.github.io/rapid-transcription/.

# Configuration

For basic customization, RITZ provides two different URL options to configure certain settings delimited by a question mark.

First, the user specifies custom hotkeys in the following format `key,value` delimited by semicolons. For example, if a user wanted the `a` key to label `apple`, they would add the option `a,apple` to the first option field in the URL.

An exclamation mark after the value indicates that the label should be immediately applied and the next image should be selected. For example, if a user wanted the `b` key to label `banana` immediately, they would add the option `b,!banana` to the first option field in the URL.

Next, the user can specify image size. For example, if a user wanted their images to be displayed at `512px`, they would add the option `512px` to the URL.

The final URL would look like https://utk-pairs.github.io/rapid-transcription/?a,apple;b,banana?512px

Alternatively, a user can use the javascript console to add bindings. For example: `add_binding("c", "Chase")`.

# Hosting

To host your own version of RITZ, just host the static files as you would any other website. There are no other server dependencies.