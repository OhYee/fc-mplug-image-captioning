import { ResultList } from '@/components/List';
import { UploadImage } from '@/components/Upload';
import { getBase64Src } from '@/utils/blob';
import { md5 } from '@/utils/md5';
import { ImageItem } from '@/utils/type';
import { Card, Space, Typography } from 'antd';
import React from 'react';
import { getEndpoint } from '@/utils/api';

async function getURLResult(url: string) {
  const resp = await fetch(
    `${getEndpoint()}/url?url=${encodeURIComponent(url)}`,
  );
  const data = await resp.json();
  return data?.data?.caption;
}

async function getBase64Result(b64: string) {
  const resp = await fetch(`${getEndpoint()}/base64`, {
    method: 'POST',
    body: b64,
  });
  const data = await resp.json();
  return data?.data?.caption;
}

export default function HomePage() {
  const [images, setImages] = React.useState<ImageItem[]>([]);
  const [resultMap, setResultMap] = React.useState<{
    [hash: string]: string | false | undefined;
  }>({});

  React.useEffect(() => {
    // prewarm
    getURLResult('https://www.modelscope.cn/static/img/logo.png');
  }, [])

  const getResult = React.useCallback(
    (img: ImageItem) => {
      setResultMap((prev) => ({ ...prev, [img.hash]: undefined }));

      (img.isURL ? getURLResult(img.url) : getBase64Result(img?.data || ''))
        .then((result) => {
          setResultMap((prev) => ({ ...prev, [img.hash]: result }));
        })
        .catch(() => {
          setResultMap((prev) => ({ ...prev, [img.hash]: false }));
        });
    },
    [setResultMap],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Typography.Title>mPLUG图像描述模型-中文-base</Typography.Title>
        <Typography.Text>
          图像描述：给定一张图片，模型根据图片信息生成一句对应描述。可以应用于给一张图片配上一句文字或者打个标签的场景。注：本模型为mPLUG-图像描述的中文Base模型，参数量约为3.5亿。
        </Typography.Text>
        <Typography.Link href="https://www.modelscope.cn/models/damo/mplug_image-captioning_coco_base_zh/summary">
          模型链接
        </Typography.Link>
      </Card>

      <Space
        direction="vertical"
        size="large"
        style={{ width: '90%', padding: '0 5%' }}
      >
        <UploadImage
          urlCallback={(url) => {
            const item = {
              url,
              hash: md5(url),
              isURL: true,
            };
            setImages([...images, item]);

            getResult(item);
          }}
          uploadCallback={(b64) => {
            const item = {
              data: b64,
              url: getBase64Src(b64),
              hash: md5(b64),
              isURL: false,
            };
            setImages([...images, item]);

            getResult(item);
          }}
        />
        <ResultList images={images} resultMap={resultMap} retry={getResult} />
      </Space>
    </Space>
  );
}
