import {IExecutionResult} from "../src/services";
import {BlockType, Event, Output} from "../src/types-js/api/v1/event_pb";
import {Value} from "google-protobuf/google/protobuf/struct_pb";
import * as common_v1_errors_pb from "../src/types-js/common/v1/errors_pb";
import Start = Event.Start;
import End = Event.End;
import Response = Event.Response;

describe('execution result', () => {
  it('test execution result without error', async () => {
    const events: Event[] = [];
    {
      const event = new Event();
      const start = new Start();
      event.setStart(start);
      event.setName("Step1");
      event.setType(BlockType.BLOCK_TYPE_BREAK)
      events.push(event);
    }

    {
      const event = new Event();
      const end = new End();
      const output = new Output()
      output.setResult(Value.fromJavaScript({"ffie": 1000}))
      end.setOutput(output)
      event.setEnd(end);
      event.setName("Step1");
      event.setType(BlockType.BLOCK_TYPE_BREAK)
      events.push(event)
    }

    {
      const event = new Event();
      const start = new Start();
      event.setStart(start);
      event.setName("Step2");
      event.setType(BlockType.BLOCK_TYPE_CONDITIONAL)
      events.push(event);
    }

    {
      const event = new Event();
      const end = new End();
      const output = new Output()
      output.setResult(Value.fromJavaScript({"tsla": 0}))
      end.setOutput(output)
      event.setEnd(end);
      event.setName("Step2");
      event.setType(BlockType.BLOCK_TYPE_CONDITIONAL)
      events.push(event)
    }

    {
      const event = new Event();
      const response = new Response();
      response.setLast("Step2");
      event.setResponse(response)
      events.push(event)
    }

    const executionResult = new IExecutionResult({events});
    expect(executionResult.getOutput().getResult().toJavaScript()).toEqual({"tsla": 0});
    expect(executionResult.getErrors()).toEqual([]);
    expect(executionResult.getEvents()).toEqual(events);

    expect(executionResult.getResult()).toEqual({"tsla": 0});
    expect(executionResult.getBlockResult("Step1")).toEqual({"ffie": 1000});
    expect(executionResult.getBlockResult("Step2")).toEqual({"tsla": 0});
  })

  it('test execution result with error', async () => {
    const events: Event[] = [];
    {
      const event = new Event();
      const start = new Start();
      event.setStart(start);
      event.setName("Step1");
      event.setType(BlockType.BLOCK_TYPE_BREAK)
      events.push(event);
    }

    {
      const event = new Event();
      const end = new End();
      const output = new Output()
      output.setResult(Value.fromJavaScript({"ffie": 1000}))
      end.setOutput(output)
      event.setEnd(end);
      event.setName("Step1");
      event.setType(BlockType.BLOCK_TYPE_BREAK)
      events.push(event)
    }

    {
      const event = new Event();
      const start = new Start();
      event.setStart(start);
      event.setName("Step2");
      event.setType(BlockType.BLOCK_TYPE_CONDITIONAL)
      events.push(event);
    }

    {
      const event = new Event();
      const end = new End();
      const error = new common_v1_errors_pb.Error()
      error.setName("error name 2")
      error.setMessage("error messasge2 ")
      end.setError(error)

      event.setEnd(end)
      event.setName("Step2")
      event.setType(BlockType.BLOCK_TYPE_CONDITIONAL)
      events.push(event)
    }

    const error = new common_v1_errors_pb.Error()
    error.setName("error name 2")
    error.setMessage("error message2")

    {
      const event = new Event();
      const response = new Response();
      response.setLast("Step2");
      response.setErrorsList([error])
      event.setResponse(response)
      events.push(event)
    }

    const executionResult = new IExecutionResult({events});

    expect(() => executionResult.getResult()).toThrow(`Api has an error. error name 2: error message2`);
    expect(executionResult.getBlockResult("Step1")).toEqual({"ffie": 1000});
    expect(() => executionResult.getBlockResult("Step2")).toThrow("Block has an error: Step2.");

    expect(executionResult.getErrors()).toEqual([error]);
  })

  it('no response event', async () => {
    const events: Event[] = [];
    {
      const event = new Event();
      const start = new Start();
      event.setStart(start);
      event.setName("Step1");
      event.setType(BlockType.BLOCK_TYPE_BREAK)
      events.push(event);
    }

    {
      const event = new Event();
      const end = new End();
      const output = new Output()
      output.setResult(Value.fromJavaScript({"ffie": 1000}))
      end.setOutput(output)
      event.setEnd(end);
      event.setName("Step1");
      event.setType(BlockType.BLOCK_TYPE_BREAK)
      events.push(event)
    }

    expect(() =>  new IExecutionResult({events})).toThrow("Response event does not exist");
  })

  it('response event does not match any existing events', async () => {
    const events: Event[] = [];
    {
      const event = new Event();
      const start = new Start();
      event.setStart(start);
      event.setName("Step1");
      event.setType(BlockType.BLOCK_TYPE_BREAK)
      events.push(event);
    }

    {
      const event = new Event();
      const end = new End();
      const output = new Output()
      output.setResult(Value.fromJavaScript({"ffie": 1000}))
      end.setOutput(output)
      event.setEnd(end);
      event.setName("Step1");
      event.setType(BlockType.BLOCK_TYPE_BREAK)
      events.push(event)
    }

    {
      const event = new Event();
      const response = new Response();
      response.setLast("Step2");
      event.setResponse(response)
      events.push(event)
    }

    expect(() =>  new IExecutionResult({events})).toThrow("Response event not found: Step2.");
  })

  it('block event does not exist', async () => {
    const events: Event[] = [];
    {
      const event = new Event();
      const start = new Start();
      event.setStart(start);
      event.setName("Step1");
      event.setType(BlockType.BLOCK_TYPE_BREAK)
      events.push(event);
    }

    {
      const event = new Event();
      const end = new End();
      const output = new Output()
      output.setResult(Value.fromJavaScript({"ffie": 1000}))
      end.setOutput(output)
      event.setEnd(end);
      event.setName("Step1");
      event.setType(BlockType.BLOCK_TYPE_BREAK)
      events.push(event)
    }

    {
      const event = new Event();
      const response = new Response();
      response.setLast("Step1");
      event.setResponse(response)
      events.push(event)
    }
    const result = new IExecutionResult({events});
    expect(() => result.getBlockResult("Step2")).toThrow("Block does not exist: Step2.");
  })
});