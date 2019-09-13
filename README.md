# forbid.only

> A GitHub App built with [Probot](https://github.com/probot/probot) to forbid
> pull requests that still have `.only` tests in them

We've all been there. You have to write some new tests, but your test suite
takes _forever_ to run and you just want to focus on the tests you are writing.
Fortunately, most test runners offer a way to select just the tests you want to
run, usually with the suffix `.only` on your tests.

So now you can write your tests much faster, and then once they are complete you
open a pull request to add that newly tested code back into the rest of the
project, except you forgot to remove the `.only` suffix! Now _just_ your new
tests run, and squash any potential bugs!

Well, never again with `forbid.only`. Simply add this app to your repository
and it will add a failing status if the code contains any `.only` calls.

## Installation

<!-- TODO: make this link correct -->

[Install the app](https://example.com)

## Local Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Contributing

If you have suggestions for how forbid.only could be improved, or want to report
a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2019 thislooksfun <thislooksfun@repbot.org> (https://github.com/thislooksfun/forbid.only)
