'use client';
import { getTranslation } from '@/lib/i18n';
import { Button, addToast } from '@heroui/react';
import { RiDownloadLine } from '@remixicon/react';
import { useEffect, useRef } from 'react';

const twitterUrlPattern = /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/;

export default function Hero({ locale = 'en', 
    downloadButtonLabel = 'Download', 
    downloadButtonIsLoading = false,
    remainApiCount = 0,
    onDownload = (url) => {}, 
    url = 'https://x.com/elonmusk/status/1853948745521439079'
}) {
    const t = function (key) {
        return getTranslation(locale, key);
    }

    const inputRef = useRef(null);
    const onDownloadRef = useRef(onDownload);
    onDownloadRef.current = onDownload;

    useEffect(() => {
        const modelContext = document.modelContext;
        if (!modelContext?.registerTool) return;

        const controller = new AbortController();

        modelContext.registerTool({
            name: 'prepare_x_media',
            description: '校验 X/Twitter 帖子链接，填入页面输入框并启动现有媒体解析流程。只展示解析结果，不自动保存文件。',
            inputSchema: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        maxLength: 500,
                        pattern: '^https?://(twitter\\.com|x\\.com)/[a-zA-Z0-9_]+/status/[0-9]+',
                        description: '完整的 X 或 Twitter 帖子链接。',
                    },
                },
                required: ['url'],
                additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async ({ url } = {}) => {
                const normalizedUrl = String(url || '').trim();
                if (!normalizedUrl || normalizedUrl.length > 500 || !twitterUrlPattern.test(normalizedUrl)) {
                    throw new Error('url 必须是有效的 X 或 Twitter 帖子链接。');
                }
                if (!inputRef.current) {
                    throw new Error('页面输入框尚未就绪，请稍后重试。');
                }

                inputRef.current.value = normalizedUrl;
                inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
                inputRef.current.focus();
                await onDownloadRef.current(normalizedUrl);

                return JSON.stringify({
                    status: 'started',
                    url: normalizedUrl,
                    message: '链接已填入页面，媒体解析已启动；请在页面中查看并选择下载项。',
                });
            },
        }, { signal: controller.signal }).catch((error) => {
            if (error?.name !== 'AbortError') console.warn('WebMCP tool registration failed:', error);
        });

        return () => controller.abort();
    }, []);

    return (
        <>
            <div className="text-center pt-16 pb-2">
                <h1 className="text-5xl font-bold text-primary mb-2">
                    {t('Download Twitter Video And ALL')}
                </h1>
                <p className="text-4xl text-subtext mb-8">
                    {t('Free and No Registration Required')}
                </p>
                <div className="max-w-xl mx-auto pt-6">
                    <div className="relative mb-6">
                        <input
                            type="text"
                            className="w-full px-4 py-3 pr-24 rounded-xl bg-gray-800 text-gray-300 border border-foreground/10"
                            placeholder="https://x.com/username/status/123456789"
                            ref={inputRef}
                            defaultValue={url}
                            onFocus={() => {
                                inputRef.current.select();
                            }}
                        />
                        <Button
                            onPress={() => {
                                // 从剪贴板中获取   
                                navigator.clipboard.readText().then(text => {
                                    inputRef.current.value = text;
                                });
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-700 text-gray-300 rounded-lg">
                            {t('Paste')}
                        </Button>
                    </div>
                    <Button
                        onPress={() => {
                            // 从inputRef中获取
                            const text = inputRef.current.value.trim();

                            if (!text) {
                                addToast({
                                    title: t('Please enter a twitter status url'),
                                    color: 'danger',
                                    hideCloseButton: true,
                                    shouldShowTimeoutProgress: true,
                                    variant: 'bordered',
                                });
                                return;
                            }

                            if (!twitterUrlPattern.test(text)) {
                                addToast({
                                    title: t('Invalid twitter status url format'),
                                    color: 'danger',
                                    hideCloseButton: true,
                                    shouldShowTimeoutProgress: true,
                                    variant: 'bordered',
                                });
                                return;
                            }

                            onDownload(text);
                        }}
                        isLoading={downloadButtonIsLoading}
                        spinnerPlacement="end"
                        startContent={<RiDownloadLine />}
                        color="primary" className="text-lg py-6 px-20 rounded-full mb-3" >
                        {t(downloadButtonLabel)}
                    </Button>
                    <p className="text-gray-500 text-sm">
                        {t('API Status: ')} {remainApiCount}
                    </p>
                </div>
            </div>
        </>
    );
}
