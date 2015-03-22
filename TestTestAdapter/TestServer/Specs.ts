import TestContext = require('./TestContext');

export interface NamingUtils {
    getDisplayName(spec: Spec, server: Server);
    getFullyQualifiedName(spec: Spec, server: Server);
}

export interface Server {
    projectName: string;
    namingUtils: NamingUtils;
    testRunStarted(): void;
    testRunCompleted(specs: Spec[]): void;
}

export interface StackInfo {
    skip?: number;
    skipFunctions?: string;
    stack?: string;
    stacktrace?: string;
    'opera#sourceloc'?: any;
}

export interface Context {
    name: string;
    testContext?: TestContext;
}

export interface SpecData {
    id?: string;
    description?: string;
    log?: string[];
    skipped?: boolean;
    success?: boolean;
    suite?: string[];
    time?: number;
    startTime?: number;
    endTime?: number;
    failures?: Failure[];
    source?: StackInfo;
}

export interface Failure {
    message?: string;
    stack?: StackInfo;
    passed?: boolean;
}

export interface Spec {
    id: string;
    description: string;
    fullyQualifiedName?: string;
    displayName?: string;
    suite: string[];
    source: Source;
    results?: SpecResult[];
}

export interface SpecResult {
    name: string;
    success: boolean;
    skipped: boolean;
    output: string;
    time: number;
    startTime: number;
    endTime: number;
    log?: string[];
    failures: Expectation[];
}

export interface Source {
    functionName?: string;
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    source?: Source;
}

export interface Expectation {
    message: string;
    stack: string[];
    passed: boolean;
}
