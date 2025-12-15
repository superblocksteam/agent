// package: auth.v1
// file: auth/v1/auth.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class Claims extends jspb.Message { 
    getUserEmail(): string;
    setUserEmail(value: string): Claims;
    getOrgId(): string;
    setOrgId(value: string): Claims;
    getOrgType(): string;
    setOrgType(value: string): Claims;
    getRbacRole(): string;
    setRbacRole(value: string): Claims;
    clearRbacGroupObjectsList(): void;
    getRbacGroupObjectsList(): Array<Claims.RbacGroupObject>;
    setRbacGroupObjectsList(value: Array<Claims.RbacGroupObject>): Claims;
    addRbacGroupObjects(value?: Claims.RbacGroupObject, index?: number): Claims.RbacGroupObject;
    getUserType(): string;
    setUserType(value: string): Claims;
    getUserId(): string;
    setUserId(value: string): Claims;
    getUserName(): string;
    setUserName(value: string): Claims;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): google_protobuf_struct_pb.Struct | undefined;
    setMetadata(value?: google_protobuf_struct_pb.Struct): Claims;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Claims.AsObject;
    static toObject(includeInstance: boolean, msg: Claims): Claims.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Claims, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Claims;
    static deserializeBinaryFromReader(message: Claims, reader: jspb.BinaryReader): Claims;
}

export namespace Claims {
    export type AsObject = {
        userEmail: string,
        orgId: string,
        orgType: string,
        rbacRole: string,
        rbacGroupObjectsList: Array<Claims.RbacGroupObject.AsObject>,
        userType: string,
        userId: string,
        userName: string,
        metadata?: google_protobuf_struct_pb.Struct.AsObject,
    }


    export class RbacGroupObject extends jspb.Message { 
        getId(): string;
        setId(value: string): RbacGroupObject;
        getName(): string;
        setName(value: string): RbacGroupObject;

        serializeBinary(): Uint8Array;
        toObject(includeInstance?: boolean): RbacGroupObject.AsObject;
        static toObject(includeInstance: boolean, msg: RbacGroupObject): RbacGroupObject.AsObject;
        static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
        static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
        static serializeBinaryToWriter(message: RbacGroupObject, writer: jspb.BinaryWriter): void;
        static deserializeBinary(bytes: Uint8Array): RbacGroupObject;
        static deserializeBinaryFromReader(message: RbacGroupObject, reader: jspb.BinaryReader): RbacGroupObject;
    }

    export namespace RbacGroupObject {
        export type AsObject = {
            id: string,
            name: string,
        }
    }

}
