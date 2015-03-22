﻿import JsonServer = require('./JsonServer');
import Specs = require('./Specs');
import DefaultNamingUtils = require('./DefaultNamingUtils');
import Q = require('q');

class TestServer extends JsonServer.Server implements Specs.Server {
    constructor(public projectName: string, public port: number = 0, public host?: string) {
        super(port, host);
    }

    namingUtils: Specs.NamingUtils = DefaultNamingUtils;
    events: Q.Deferred<void> = Q.defer<void>();
    specs: Q.Deferred<Specs.Spec[]> = Q.defer<Specs.Spec[]>();

    loadNamingUtils(namingModule: string) {
        function ifFn(fn: any, defaultFn: any): any {
            return typeof fn === 'function' ? fn : defaultFn;
        }

        var namingUtils = require(namingModule);
        if (namingUtils) {
            this.namingUtils = {
                getDisplayName: ifFn(namingUtils.getDisplayName, DefaultNamingUtils.getDisplayName),
                getFullyQualifiedName: ifFn(namingUtils.getFullyQualifiedName, DefaultNamingUtils.getFullyQualifiedName)
            };
        }
    }

    onError(error: any, connection: JsonServer.Connection) {
    }

    onClose(had_error: boolean, connection: JsonServer.Connection) {
    }

    testRunStarted(): void {
        if (this.specs.promise.isFulfilled()) {
            this.specs = Q.defer<Specs.Spec[]>();
        }
        this.events.notify('Test run start');
    }

    testRunCompleted(specs: Specs.Spec[]): void {
        this.events.notify('Test run complete');
        this.specs.resolve(specs);
    }

    testRunStartedCommand = this.addCommand('test run started',(command, message, connection) => {
        this.testRunStarted();
        return Q.resolve<void>(undefined);
    });

    testRunCompletedCommand = this.addCommand('test run completed',(command, message, connection) => {
        this.testRunCompleted(message.specs);
        return Q.resolve<void>(undefined);
    });

    eventCommand = this.addCommand('event',(command, message, connection) => {
        this.events.promise.progress(event => {
            var message = <any>event;
            if (typeof event === 'string') {
                message = { event: event };
            }
            connection.write(message);
        });
        this.events.notify('Connected');
        return this.events.promise;
    });

    stopCommand = this.addCommand('stop',(command, message, connection) => {
        this.events.resolve(undefined);
        var requests: Q.Promise<void>[] = Array.prototype.concat.call(
            this.eventCommand.getRequests(),
            this.discoverCommand.getRequests()
            );
        return Q.all(requests)
            .then(() => process.exit(0));
    });

    discoverCommand = this.addCommand('discover',(command, message, connection) => {
        return this.specs.promise.then(specs => {
            var promise = Q.resolve<void>(undefined);
            specs.forEach(spec => {
                promise = promise.then(() => {
                    if (connection.connected) {
                        return connection.write(spec);
                    }
                    throw new Error("Connection closed");
                });
            });
            return promise.then(() => this.events.notify('Tests discovered'));
        });
    });

    requestRunCommand = this.addCommand('requestRun',(command, message, connection) => {
        this.events.notify({
            event: 'Test run requested',
            tests: message.tests
        });
        return Q.resolve<void>(undefined);
    });
}

export = TestServer;