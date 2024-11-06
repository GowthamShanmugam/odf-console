import { Sha256 } from '@aws-crypto/sha256-browser';
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
  PutBucketTaggingCommand,
  GetObjectCommand,
  GetObjectTaggingCommand,
  DeleteObjectsCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketTaggingCommand,
  GetBucketAclCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest, RequestSigner } from '@smithy/types';
import {
  CreateBucket,
  ListBuckets,
  ListObjectsV2,
  PutBucketTags,
  GetSignedUrl,
  GetObject,
  GetObjectTagging,
  DeleteObjects,
  GetBucketEncryption,
  GetBucketVersioning,
  GetBucketTagging,
  GetBucketAcl,
  GetBucketPolicy,
} from './types';

const createCustomSigner = (region, credentials, host): RequestSigner => {
  const signer = new SignatureV4({
    credentials: credentials,
    region: region,
    service: 's3',
    uriEscapePath: false,
    applyChecksum: false,
    sha256: Sha256,
  });

  return {
    sign: async (request: HttpRequest) => {
      //request.headers.host = host;
      return signer.sign(request);
    },
  };
};

export class S3Commands extends S3Client {
  constructor(
    endpoint: string,
    accessKeyId: string,
    secretAccessKey: string,
    host: string
  ) {
    super({
      // "region" is a required parameter for the SDK, using "none" as a workaround
      region: 'none',
      endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: true,
      signingEscapePath: true,
      signer: createCustomSigner(
        'none',
        {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
        },
        host
      ),
    });
  }

  // Bucket command members (alphabetical order)
  createBucket: CreateBucket = (input) =>
    this.send(new CreateBucketCommand(input));

  getBucketAcl: GetBucketAcl = (input) =>
    this.send(new GetBucketAclCommand(input));

  getBucketEncryption: GetBucketEncryption = (input) =>
    this.send(new GetBucketEncryptionCommand(input));

  getBucketPolicy: GetBucketPolicy = (input) =>
    this.send(new GetBucketPolicyCommand(input));

  getBucketTagging: GetBucketTagging = (input) =>
    this.send(new GetBucketTaggingCommand(input));

  getBucketVersioning: GetBucketVersioning = (input) =>
    this.send(new GetBucketVersioningCommand(input));

  listBuckets: ListBuckets = (input) => {
    const command = new ListBucketsCommand(input);
    /*command.middlewareStack.add(
      (next) =>
        (args) => {
          const r = args.request as HttpRequest
    
          r.hostname = "s3-openshift-storage.apps.drcluster1-nov-7-24.devcluster.openshift.com"
    
          return next(args)
        },
      { step: 'build', priority: 'high' },
    )*/
    return this.send(command);

  }

  putBucketTags: PutBucketTags = (input) =>
    this.send(new PutBucketTaggingCommand(input));

  // Object command members
  listObjects: ListObjectsV2 = (input) =>
    this.send(new ListObjectsV2Command(input));

  getSignedUrl: GetSignedUrl = (input, expiresIn) =>
    getSignedUrl(this, new GetObjectCommand(input), { expiresIn });

  getObject: GetObject = (input) => this.send(new GetObjectCommand(input));

  getObjectTagging: GetObjectTagging = (input) =>
    this.send(new GetObjectTaggingCommand(input));

  deleteObjects: DeleteObjects = (input) =>
    this.send(new DeleteObjectsCommand(input));

  getUploader = (file: File, key: string, bucketName: string): Upload => {
    const uploader = new Upload({
      client: this,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: file,
        ...(file.type ? { ContentType: file.type } : {}),
      },
      partSize: 5 * 1024 * 1024,
      queueSize: 4,
    });
    return uploader;
  };
}
