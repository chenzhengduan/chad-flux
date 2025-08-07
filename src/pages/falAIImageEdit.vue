<template>
  <div class="fal-ai-image-edit">
    <h2>fal.ai 图像编辑 DEMO</h2>
    <div class="apikey-section">
      <el-form :inline="true" class="apikey-form">
        <el-form-item label="API Key：">
          <el-input
            v-model="apiKeyInput"
            type="password"
            placeholder="请输入 fal.ai API Key"
            style="width: 260px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveApiKey">保存</el-button>
          <el-button v-if="apiKey" @click="clearApiKey" type="default">清除</el-button>
        </el-form-item>
      </el-form>
      <div class="tip" v-if="!apiKey">
        <span style="color: red;">请先输入 API Key，所有功能仅用于 DEMO，切勿用于生产环境！</span>
      </div>
      <div class="tip" v-else>
        <span style="color: green;">API Key 已保存，可正常使用 fal.ai 能力。</span>
      </div>
    </div>
    <el-form class="falai-form" @submit.prevent="onSubmit" label-width="140px">
      <el-form-item label="固定提示词：">
        <div style="background: #f5f7fa; padding: 12px; border-radius: 6px; border: 1px solid #e4e7ed; margin-bottom: 8px;">
          <div style="font-size: 14px; color: #606266; line-height: 1.6;">
            保持瓶子的确切形状、比例和泵头位置不变。<br>
            不要改变瓶子的数量、大小、角度、位置或布局 — 即使图像包含多个不同大小的瓶子。<br>
            瓶子的结构和位置必须保持完全不变。<br>
            任何添加的内容都应该自然地、干净地集成，而不破坏或覆盖原始布局。<br>
            非要求不要追加额外的瓶子出来。<br>
            注意：请根据产品信息应用所有视觉更新，同时保持瓶子的完整性。
          </div>
        </div>
        <el-checkbox v-model="useFixedPrompt" :disabled="!apiKey">使用固定提示词</el-checkbox>
      </el-form-item>
      <el-form-item label="描述（Prompt）：">
        <el-input
          v-model="prompt"
          type="textarea"
          :autosize="{ minRows: 4, maxRows: 8 }"
          :disabled="!apiKey"
          placeholder="请输入描述，如：在面粉旁边放一个甜甜圈。"
          style="width: 100%; font-size: 16px;"
        />
        <el-tooltip content="用于生成图像的提示词" placement="top">
          <el-button type="text" size="small" style="padding: 0; margin-left: 8px;">参数说明</el-button>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="图片：">
        <el-upload
          :show-file-list="true"
          :disabled="!apiKey"
          accept="image/*"
          action="#"
          :auto-upload="false"
          :on-change="onFileChange"
          :limit="1"
        >
          <el-button :disabled="!apiKey">选择图片</el-button>
        </el-upload>
        <span style="margin: 0 8px;">或</span>
        <el-input v-model="imageUrl" :disabled="!apiKey" placeholder="图片 URL（可选）" style="width: 260px;" />
        
        <!-- 选择的图片缩略图 -->
        <div v-if="selectedImagePreview" style="margin-top: 12px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">选择的图片：</div>
          <div style="display: inline-block; border: 1px solid #e4e7ed; border-radius: 4px; padding: 4px; background: #fff;">
            <img 
              :src="selectedImagePreview" 
              alt="selected-image"
              style="max-width: 120px; max-height: 80px; display: block; cursor: pointer; object-fit: contain;" 
              @click="previewSelectedImage"
            />
          </div>
        </div>
        <el-tooltip content="用于 omnimodel 的图像提示" placement="top">
          <el-button type="text" size="small" style="padding: 0; margin-left: 8px;">参数说明</el-button>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="种子值（Seed）：">
        <el-input-number v-model="seed" :disabled="!apiKey" :min="1" :max="999999" style="width: 120px;" />
        <el-tooltip content="相同的种子值和提示词给定给相同版本的模型将每次都输出相同的图像" placement="top">
          <el-button type="text" size="small" style="padding: 0; margin-left: 8px;">参数说明</el-button>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="引导强度：">
        <el-input-number v-model="guidanceScale" :min="1" :max="20" :step="0.1" :disabled="!apiKey" />
        <el-tooltip content="CFG（无分类器引导）比例是衡量您希望模型在寻找相关图像时对提示词的遵循程度。默认值：3.5" placement="top">
          <el-button type="text" size="small" style="padding: 0; margin-left: 8px;">参数说明</el-button>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="生成图片数量：">
        <el-input-number v-model="numImages" :min="1" :max="6" :disabled="!apiKey" />
        <el-tooltip content="要生成的图像数量。默认值：1" placement="top">
          <el-button type="text" size="small" style="padding: 0; margin-left: 8px;">参数说明</el-button>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="输出格式：">
        <el-select v-model="outputFormat" :disabled="!apiKey" style="width: 120px;">
          <el-option label="JPEG 格式" value="jpeg" />
          <el-option label="PNG 格式" value="png" />
        </el-select>
        <el-tooltip content="生成图像的格式。默认值：jpeg" placement="top">
          <el-button type="text" size="small" style="padding: 0; margin-left: 8px;">参数说明</el-button>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="安全等级：">
        <el-select v-model="safetyTolerance" :disabled="!apiKey" style="width: 120px;">
          <el-option label="最严格" value="1" />
          <el-option label="严格" value="2" />
          <el-option label="中等" value="3" />
          <el-option label="宽松" value="4" />
          <el-option label="最宽松" value="5" />
          <el-option label="无限制" value="6" />
        </el-select>
        <el-tooltip content="生成图像的安全容差级别，1最严格，6最宽松。默认值：2" placement="top">
          <el-button type="text" size="small" style="padding: 0; margin-left: 8px;">参数说明</el-button>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="宽高比：">
        <el-select v-model="aspectRatio" :disabled="!apiKey" style="width: 120px;">
          <el-option label="默认" value="" />
          <el-option label="21:9" value="21:9" />
          <el-option label="16:9" value="16:9" />
          <el-option label="4:3" value="4:3" />
          <el-option label="3:2" value="3:2" />
          <el-option label="1:1" value="1:1" />
          <el-option label="2:3" value="2:3" />
          <el-option label="3:4" value="3:4" />
          <el-option label="9:16" value="9:16" />
          <el-option label="9:21" value="9:21" />
        </el-select>
        <el-tooltip content="生成图像的宽高比" placement="top">
          <el-button type="text" size="small" style="padding: 0; margin-left: 8px;">参数说明</el-button>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="同步模式：">
        <el-switch v-model="syncMode" :disabled="!apiKey" />
        <el-tooltip content="如果设置为true，函数将等待图像生成并上传后再返回响应。默认值：false" placement="top">
          <el-button type="text" size="small" style="padding: 0; margin-left: 8px;">参数说明</el-button>
        </el-tooltip>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit" :disabled="!apiKey || loading">{{ loading ? '生成中...' : '生成图片' }}</el-button>
      </el-form-item>
    </el-form>
    <div v-if="errorMsg" style="color: red; margin-top: 16px;">{{ errorMsg }}</div>
    <div v-if="logs.length" style="margin-top: 16px;">
      <div style="font-weight: bold;">日志：</div>
      <ul>
        <li v-for="(log, i) in logs" :key="i">{{ log }}</li>
      </ul>
    </div>
    <div v-if="resultImages.length" style="margin-top: 24px;">
      <div style="font-weight: bold;">生成结果：</div>
      <div style="display: flex; flex-wrap: wrap; gap: 16px;">
        <div v-for="(img, i) in resultImages" :key="i" style="border:1px solid #eee; padding:8px; border-radius:6px; background:#fff;">
          <img 
            :src="img.url" 
            :alt="'result-'+i" 
            :width="img.width/4" 
            :height="img.height/4" 
            style="max-width:200px; display:block; margin-bottom:8px; cursor: pointer;" 
            @click="previewImage(img)"
          />
          <div style="font-size:12px; color:#888;">{{ img.width }}x{{ img.height }}</div>
        </div>
      </div>
    </div>
    <div v-if="history.length" style="margin-top: 40px;">
      <div style="font-weight: bold; font-size: 16px;">历史记录</div>
      <div v-for="(item, idx) in history" :key="idx" style="margin-top: 18px; padding:12px; border:1px solid #eee; border-radius:6px; background:#f8f8fa;">
        <div style="font-size:13px; color:#888; margin-bottom:6px;">{{ item.time }}</div>
        <div style="margin-bottom:6px;">Prompt: <span style="color:#333">{{ item.params.prompt }}</span></div>
        <div style="margin-bottom:6px;">引导强度: {{ item.params.guidance_scale }} | 数量: {{ item.params.num_images }} | 输出格式: {{ item.params.output_format }} <span v-if="item.params.aspect_ratio">| 宽高比: {{ item.params.aspect_ratio }}</span></div>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          <div v-for="(img, i) in item.images" :key="i" style="border:1px solid #eee; padding:4px; border-radius:4px; background:#fff;">
            <img 
              :src="img.url" 
              :alt="'history-'+idx+'-'+i" 
              :width="img.width/8" 
              :height="img.height/8" 
              style="max-width:100px; display:block; cursor: pointer;" 
              @click="previewImage(img)"
            />
            <div style="font-size:11px; color:#aaa;">{{ img.width }}x{{ img.height }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图片预览弹窗 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="80%" :before-close="closePreview">
      <div style="text-align: center;">
        <img 
          v-if="previewImageData" 
          :src="previewImageData.url" 
          style="max-width: 100%; max-height: 70vh; object-fit: contain;" 
        />
        <div v-if="previewImageData" style="margin-top: 16px; color: #666;">
          尺寸: {{ previewImageData.width }} x {{ previewImageData.height }}
        </div>
      </div>
    </el-dialog>
    
    <!-- 选择图片预览弹窗 -->
    <el-dialog v-model="selectedImagePreviewVisible" title="选择图片预览" width="80%" :before-close="closeSelectedImagePreview">
      <div style="text-align: center;">
        <img 
          v-if="selectedImagePreview" 
          :src="selectedImagePreview" 
          style="max-width: 100%; max-height: 70vh; object-fit: contain;" 
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
let fal: any = null;

const apiKeyInput = ref('');
const apiKey = ref<string | null>(null);

// 移除 onMounted 里的 localStorage 逻辑
// onMounted(() => {
//   const saved = localStorage.getItem('fal_apikey');
//   if (saved) {
//     apiKeyInput.value = saved;
//     apiKey.value = saved;
//   }
// });

async function loadFalClient() {
  if (!fal) {
    fal = (await import('@fal-ai/client')).fal;
  }
}

function saveApiKey() {
  if (apiKeyInput.value) {
    // localStorage.setItem('fal_apikey', apiKeyInput.value); // 移除
    apiKey.value = apiKeyInput.value;
  }
}

function clearApiKey() {
  // localStorage.removeItem('fal_apikey'); // 移除
  apiKeyInput.value = '';
  apiKey.value = null;
}

const prompt = ref('');
const imageUrl = ref('');
const file = ref<File | null>(null);
const seed = ref<number | null>(null);
const guidanceScale = ref(3.5);
const numImages = ref(1);
const outputFormat = ref('jpeg');
const safetyTolerance = ref('2');
const aspectRatio = ref('');
const syncMode = ref(false);

// 固定提示词相关
const useFixedPrompt = ref(true);
const fixedPromptText = `Keep the exact same bottle shape, proportions, and pump head position.
Do not change the number, size, angle, position, or layout of the bottles — even if the image contains multiple bottles of different sizes.
The structure and placement of the bottles must remain completely unchanged.
Any added content should be naturally and cleanly integrated without disrupting or covering the original layout.
Non-requirement: Do not add additional bottles.
Note: Please apply all visual updates based on the product information while preserving the bottle`;

const loading = ref(false);
const logs = ref<string[]>([]);
const errorMsg = ref('');
const resultImages = ref<{url:string,width:number,height:number}[]>([]);
const history = ref<{params:any, images:any[], time:string}[]>([]);

// 图片预览相关
const previewVisible = ref(false);
const previewImageData = ref<{url:string,width:number,height:number} | null>(null);

// 选择图片预览相关
const selectedImagePreview = ref<string | null>(null);
const selectedImagePreviewVisible = ref(false);

function onFileChange(uploadFile: any) {
  file.value = uploadFile.raw || null;
  
  // 生成缩略图预览
  if (uploadFile.raw) {
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedImagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(uploadFile.raw);
  } else {
    selectedImagePreview.value = null;
  }
}

function previewSelectedImage() {
  if (selectedImagePreview.value) {
    selectedImagePreviewVisible.value = true;
  }
}

function closeSelectedImagePreview() {
  selectedImagePreviewVisible.value = false;
}

function previewImage(img: {url:string,width:number,height:number}) {
  previewImageData.value = img;
  previewVisible.value = true;
}

function closePreview() {
  previewVisible.value = false;
  previewImageData.value = null;
}

async function onSubmit() {
  errorMsg.value = '';
  logs.value = [];
  resultImages.value = [];
  
  // 检查必填项
  if (!prompt.value.trim()) {
    errorMsg.value = '请输入描述（Prompt）';
    return;
  }
  
  loading.value = true;
  await loadFalClient();
  if (!fal) {
    errorMsg.value = 'fal-ai 客户端加载失败';
    loading.value = false;
    return;
  }
  if (!apiKey.value) {
    errorMsg.value = '请先输入 API Key';
    loading.value = false;
    return;
  }
  fal.config({ credentials: apiKey.value });
  let usedImageUrl = imageUrl.value;
  try {
    if (file.value) {
      logs.value.push('正在上传图片...');
      const url = await fal.storage.upload(file.value);
      usedImageUrl = url;
      logs.value.push('图片上传成功');
    }
    if (!usedImageUrl) {
      errorMsg.value = '请上传图片或填写图片 URL';
      loading.value = false;
      return;
    }
    logs.value.push('正在请求 fal.ai 生成图片...');
    
    // 拼接固定提示词和用户输入
    const finalPrompt = useFixedPrompt.value 
      ? `${fixedPromptText}\n\n${prompt.value}`
      : prompt.value;
    
    const params: any = {
      prompt: finalPrompt,
      image_url: usedImageUrl,
      guidance_scale: guidanceScale.value,
      num_images: numImages.value,
      output_format: outputFormat.value,
      safety_tolerance: safetyTolerance.value,
      sync_mode: syncMode.value,
      ...(aspectRatio.value ? { aspect_ratio: aspectRatio.value } : {}),
      ...(seed.value ? { seed: seed.value } : {})
    };
    const result = await fal.subscribe('fal-ai/flux-pro/kontext/max', {
      input: params,
      logs: true,
      onQueueUpdate: (update: any) => {
        if (update.status === 'IN_PROGRESS' && update.logs) {
          update.logs.map((log: any) => log.message).forEach((msg: string) => {
            if (!logs.value.includes(msg)) logs.value.push(msg);
          });
        }
      }
    });
    if (result.data && result.data.images) {
      resultImages.value = result.data.images;
      logs.value.push('图片生成成功');
      history.value.unshift({
        params: JSON.parse(JSON.stringify(params)),
        images: JSON.parse(JSON.stringify(result.data.images)),
        time: new Date().toLocaleString()
      });
    } else {
      errorMsg.value = '未获取到图片结果';
    }
  } catch (e: any) {
    errorMsg.value = e?.message || '请求失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.fal-ai-image-edit {
  max-width: 700px;
  margin: 40px auto;
  padding: 32px 32px 24px 32px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.04);
}
.apikey-section {
  margin-bottom: 24px;
}
.falai-form {
  margin-top: 32px;
  padding: 16px 0 0 0;
  background: #fff;
  border-radius: 6px;
  border: none;
}
.tip {
  margin-top: 8px;
  font-size: 14px;
}
</style> 