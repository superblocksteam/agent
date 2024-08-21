import {IExecutorServiceServer} from '../../src/types-js/api/v1/service_grpc_pb';
import {
    AsyncResponse,
    AwaitResponse,
    CancelRequest,
    CancelResponse,
    DeleteRequest,
    DeleteResponse,
    DownloadRequest,
    DownloadResponse,
    ExecuteRequest,
    Function,
    MetadataRequest,
    MetadataRequestDeprecated,
    MetadataResponse,
    OutputRequest,
    OutputResponse,
    StatusRequest,
    StreamResponse,
    TestRequest,
    TestResponse,
    TwoWayRequest,
    TwoWayResponse,
    ValidateRequest
} from '../../src/types-js/api/v1/service_pb';
import {
    sendUnaryData,
    ServerDuplexStream,
    ServerUnaryCall,
    ServerWritableStream,
    UntypedHandleCall
} from "@grpc/grpc-js";
import {Empty} from "google-protobuf/google/protobuf/empty_pb";
import {Event, Output} from "../../src/types-js/api/v1/event_pb";
import {Value} from 'google-protobuf/google/protobuf/struct_pb';
import {uuidv4} from "../../src/utils";
import End = Event.End;

type PromiseHandlers<T> = {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
};



// Implement the service methods
export class EmbeddedExecutorServiceServer implements IExecutorServiceServer {
    // @ts-ignore
    private inputs: object[] = [];
    // @ts-ignore
    private viewMode: any;
    // @ts-ignore
    private profile: any;
    // @ts-ignore
    private staticMockMatchers: {integrationType: string, stepName: string}[] = []
    // @ts-ignore
    private dynamicMockMatchers: boolean[] = []
    // @ts-ignore
    private staticMockReturns: any[] = []
    // @ts-ignore
    private dynamicMockReturns: any[] = []

    // @ts-ignore
    private pendings: Map<string, PromiseHandlers<any>> = new Map();

    constructor() {
    }

    getInputs() {
        return this.inputs;
    }

    getViewMode(): any {
        return this.viewMode;
    }

    getProfile(): any {
        return this.profile;
    }

    getStaticMockMatchers() {
        return this.staticMockMatchers;
    }

    getDynamicMockMatchers() {
        return this.dynamicMockMatchers
    }

    getStaticMockReturns() {
        return this.staticMockReturns;
    }

    getDynamicMockReturns() {
        return this.dynamicMockReturns
    }


    [name: string]: UntypedHandleCall;

    twoWayStream(stream: ServerDuplexStream<TwoWayRequest, TwoWayResponse>): void {
        stream.on('data', async (receive: TwoWayRequest) => {
            if (receive.hasExecute()) {
                const apiId = receive.getExecute().getFetch().getId();
                const profile = receive.getExecute().getProfile();
                this.profile = profile.getName();
                const viewMode = receive.getExecute().getFetch().getViewMode();
                this.viewMode = viewMode;
                const inputs = receive.getExecute().getInputsMap();
                const inputsNative = {};
                for (const [k] of inputs.getEntryList()) {
                    inputsNative[k] = inputs.get(k).toJavaScript();
                }
                this.inputs.push(inputsNative);
                const mockList = receive.getExecute().getMocksList();
                const mockVals = []

                for (let i = 0; i < mockList.length; i++) {
                    const mock = receive.getExecute().getMocksList()[i];
                    const on = mock.getOn();
                    if (on.hasDynamic()) {
                        const funcName = on.getDynamic();
                        const shouldMock = await this.requestFuncEvaluation(funcName, [
                            {stepName: "step1", configuration: {host: "localhost", port: "5432"}}], stream);
                        if (typeof shouldMock !== "boolean") {
                            throw new Error("Expect boolean here")
                        }
                        this.dynamicMockMatchers.push(shouldMock);
                    } else {
                        this.dynamicMockMatchers.push(undefined)
                    }

                    if (on.hasStatic()) {
                        const stat = on.getStatic();
                        this.staticMockMatchers.push({
                            stepName: stat.getStepName(),
                            integrationType: stat.getIntegrationType()
                        })
                    } else {
                        this.staticMockMatchers.push(undefined)
                    }

                    const returnn = mock.getReturn()
                    if (returnn.hasStatic()) {
                        this.staticMockReturns.push(returnn.getStatic().toJavaScript())
                    } else {
                        this.staticMockReturns.push(undefined)
                    }

                    if (returnn.hasDynamic()) {
                        const funcName = returnn.getDynamic();
                        const evaluated = await this.requestFuncEvaluation(funcName, [{username: "postgres", hostName: "localhost"}], stream);
                        this.dynamicMockReturns.push(evaluated);
                    } else {
                        this.dynamicMockReturns.push(undefined);
                    }
                }

                {
                    const response = new TwoWayResponse();
                    const streamResp = new StreamResponse()
                    const event = new Event()
                    const end = new End()
                    const output = new Output()
                    output.setResult(Value.fromJavaScript({
                        "date": "2026-01-01",
                        "faraday-future": "100",
                        "tesla": "10"
                    }))
                    end.setOutput(output)
                    event.setName("Step1")
                    event.setEnd(end)
                    streamResp.setEvent(event)
                    response.setStream(streamResp)
                    stream.write(response)
                }

                {
                    const response = new TwoWayResponse();
                    const streamResp = new StreamResponse()
                    const event = new Event()
                    const end = new End()
                    const output = new Output()
                    output.setResult(Value.fromJavaScript({
                        "date": "2027-01-01",
                        "faraday-future": "1000",
                        "tesla": "0"
                    }))
                    end.setOutput(output)
                    event.setName("Step2")
                    event.setEnd(end)
                    streamResp.setEvent(event)
                    response.setStream(streamResp)
                    stream.write(response)
                }

                {
                    const response = new TwoWayResponse();
                    const streamResp = new StreamResponse()
                    const event = new Event()
                    const eventResponse = new Event.Response()
                    eventResponse.setLast("Step2")
                    event.setResponse(eventResponse)
                    streamResp.setEvent(event)
                    response.setStream(streamResp)
                    stream.write(response)
                }

                stream.end();
            } else if (receive.hasFunction()) {
                const id = receive.getFunction().getId()
                if (receive.getFunction().hasError()) {
                    this.pendings.get(id).reject(receive.getFunction().getError());
                } else {
                    const val = receive.getFunction().getValue()
                    this.pendings.get(id).resolve(val)
                }
            }
        });


        stream.on('end', () => {
            stream.end();
        });[]

        stream.on('error', (error: Error) => {
            console.error('Error in stream:', error);
        });

        stream.on('close', () => {
            stream.end();
        });
    }

    // @ts-ignore
    async requestFuncEvaluation(funcName: string, parameters: any[], stream: ServerDuplexStream<TwoWayRequest, TwoWayResponse>): Promise<any> {
        const response: TwoWayResponse = new TwoWayResponse();

        const func = new Function.Request()
        const id = uuidv4();
        func.setId(id)
        func.setName(funcName)
        func.setParametersList(parameters.map(p => Value.fromJavaScript(p)))
        response.setFunction(func)
        const p = new Promise((resolve, reject) => {
            this.pendings.set(id, {resolve, reject});
        })

        stream.write(response);
        return ((await p) as Value).toJavaScript()
    }

    validate(call: ServerUnaryCall<ValidateRequest, Empty>, callback: sendUnaryData<Empty>): void {
    }
    async(call: ServerUnaryCall<ExecuteRequest, AsyncResponse>, callback: sendUnaryData<AsyncResponse>): void {
    }
    await(call: ServerUnaryCall<ExecuteRequest, AwaitResponse>, callback: sendUnaryData<AwaitResponse>): void {
    }
    cancel(call: ServerUnaryCall<CancelRequest, CancelResponse>, callback: sendUnaryData<CancelResponse>): void {
    }
    delete(call: ServerUnaryCall<DeleteRequest, DeleteResponse>, callback: sendUnaryData<DeleteResponse>): void {
    }
    download(call: ServerWritableStream<DownloadRequest, DownloadResponse>): void {
    }
    metadata(call: ServerUnaryCall<MetadataRequest, MetadataResponse>, callback: sendUnaryData<MetadataResponse>): void {
    }
    metadataDeprecated(call: ServerUnaryCall<MetadataRequestDeprecated, MetadataResponse>, callback: sendUnaryData<MetadataResponse>): void {
    }
    output(call: ServerUnaryCall<OutputRequest, OutputResponse>, callback: sendUnaryData<OutputResponse>): void {
    }
    status(call: ServerUnaryCall<StatusRequest, AwaitResponse>, callback: sendUnaryData<AwaitResponse>): void {
    }
    stream(call: ServerWritableStream<ExecuteRequest, StreamResponse>): void {
    }
    test(call: ServerUnaryCall<TestRequest, TestResponse>, callback: sendUnaryData<TestResponse>): void {
    }
};
