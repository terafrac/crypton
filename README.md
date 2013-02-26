# Crypton

A framework for creating zero-knowledge web applications

## What is Zero Knowledge?

Zero Knowledge applications offer meaningful privacy assurance to end users
because the servers running the application cannot read the data created and
stored by the application.

To learn more, check out the [Crypton website](https://crypton.io/).

## Get Started

To get started with Crypton development, you will need node.js v0.8.x with npm,
and uglify-js. You will also need a postgresql server running on localhost (or
edit the config file in the `server/` directory).

Clone the repository and run `make` to install the rest of the dependencies and
run the tests.

## Documentation

There are files describing the high-level specification in the `client/doc/`
and `server/doc/` directories, but currently, the best way to get a complete
picture of the Crypton system is by understanding the database schema, in
`server/lib/stores/postgresql/setup.sql`, which has lots of explanatory
comments.

## Getting Help

If you have questions that aren't answered by the provided documentation, you
may contact us at crypton-discussion@crypton.io

## Contributing

Check out the code from our
[GitHub repository](https://github.com/SpiderOak/crypton)!
This is where we are keeping our wiki and issue tracker for the project, along
with the JavaScript reference implementation.

If you are not a developer but would like to contribute in other ways, consider:

* Becoming a
  [Zero Knowledge Privacy Ambassador](https://spideroak.com/blog/20121121085239-looking-for-a-few-good-ambassadors)
* Purchasing from companies that provide a product with meaningful privacy
  built in.
* Contacting the creators of the software products you use, and making it clear
  you would appreciate them including privacy features.

## License

See the LICENSE file.
