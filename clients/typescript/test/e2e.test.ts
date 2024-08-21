import { Server, ServerCredentials, } from '@grpc/grpc-js';
import { Client } from "../src/client";
import { Api } from '../src/resources';
import { Mock } from "../src/types";
import { ExecutorServiceService } from "../src/types-js/api/v1/service_grpc_pb";
import { ViewMode } from "../src/types-js/api/v1/service_pb";
import { mysqlMock1, postgresMock1 } from "./constants";
import { EmbeddedExecutorServiceServer } from "./embedded/server";

describe('e2e', () => {

    let grpcServer;
    let executionServiceServer: EmbeddedExecutorServiceServer;

    beforeEach(() => {
        // Any setup code that needs to run before each test
        grpcServer = new Server();
        executionServiceServer = new EmbeddedExecutorServiceServer()
        grpcServer.addService(ExecutorServiceService, executionServiceServer);
        const port = 50051;
        grpcServer.bindAsync(`127.0.0.1:${port}`, ServerCredentials.createInsecure(), (error) => {
            if (error) {
                throw new Error("Embedded server failed to start.")
            }
        });
    });

    afterEach(() => {
        grpcServer.forceShutdown()
    });

    it('e2e', async () => {
        const superblocks = new Client({
            config: {
                endpoint: 'agent.staging.superblocks.com:8443',
                token: 'JZGh4iBQEy6+azS+NUeOX/5AwvPZIgdP2clNe/nah0kcJNTF',
                insecure: false
            }
        });

        const mocks: Mock[] = [
            postgresMock1,
            mysqlMock1
        ]

        const api = new Api("abcde", {
            profile: "production",
            viewMode: "preview",
        });
        const inputs = {"dropdown1": "jiefubeisuosi"};

        const res = await api.run({mocks, inputs}, superblocks);

        expect(res.getOutput().getResult().toJavaScript()).toEqual(
            {"date":"2027-01-01", "faraday-future": "1000", "tesla": "0"}
        )

        expect(res.getEvents().filter(e => e.hasEnd()).map(e => e.getEnd().getOutput().getResult().toJavaScript())).toEqual(
            [{"date": "2026-01-01", "faraday-future": "100", "tesla": "10"}, {"date": "2027-01-01", "faraday-future": "1000", "tesla": "0"}]
        )

        expect(res.getErrors().map(e => e.getName())).toEqual([])

        expect(res.getResult()).toEqual({"date": "2027-01-01", "faraday-future": "1000", "tesla": "0"})

        expect(res.getBlockResult("Step1")).toEqual({"date": "2026-01-01", "faraday-future": "100", "tesla": "10"})

        expect(executionServiceServer.getStaticMockMatchers()).toEqual(
            [
                { stepName: 'step1', integrationType: 'postgres' },
                { stepName: '', integrationType: 'mysql' }
            ]
        )

        expect(executionServiceServer.getStaticMockMatchers()).toEqual(
            [
                { stepName: 'step1', integrationType: 'postgres' },
                { stepName: '', integrationType: 'mysql' }
            ]
        )

        expect(executionServiceServer.getDynamicMockMatchers()).toEqual(
            [true, undefined]
        )

        expect(executionServiceServer.getStaticMockReturns()).toEqual(
            [ [ { date: '2026-01-01', 'faraday-future': '100', tesla: '10' } ], undefined ]
        )
        expect(executionServiceServer.getDynamicMockReturns()).toEqual(
            [ undefined, { hostName: 'localhost', username: 'postgres' } ]
        )

        expect(executionServiceServer.getInputs()).toEqual([{dropdown1: "jiefubeisuosi"}])

        expect(executionServiceServer.getProfile()).toEqual("production");

        expect(executionServiceServer.getViewMode()).toEqual(ViewMode.VIEW_MODE_PREVIEW);
    });

});