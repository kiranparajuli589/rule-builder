<template>
<div class="join-selector">
    <div class="mid-block">
        <div class="line"></div>
        <select v-model="join.operator">
            <option value="AND">AND</option>
            <option value="OR">OR</option>
        </select>
        <div class="line"></div>
    </div>

    <div v-if="!join.brackets" class="add-bracket">
        <div class="line"></div>
        <button class="circle"
            @click="addBracket()"
        >
            <span>()</span>
        </button>
    </div>

    <div
        v-for="(bracket, index) in join.brackets"
        :key="index"
        class="added-bracket"
    >
        <div class="line"></div>
        <button class="circle">()</button>
        <div class="line"></div>
    </div>
</div>  
</template>

<script>
export default {
    name: 'JoinSelector',
    props: {
        join: {
            type: Object,
            required: true
        },
    },
    data() {
        return {
            localJoin: this.join
        };
    },
    methods: {
        updateJoin() {
            this.$emit('update', this.localJoin);
        },
        addBracket() {
            this.localJoin.brackets = (this.localJoin.brackets || 0) + 1;
        },
    },
    watch: {
        localJoin: {
            handler(newJoin) {
                this.localJoin = newJoin;
                this.updateJoin();
            },
            deep: true,
        },
    },
    mounted() {
        this.localJoin = this.join;
    },
    beforeDestroy() {
        this.$emit('update', this.localJoin);
    },
};
</script>

<style lang="scss" scoped>
.join-selector{
  display: flex;
  align-items: center;
  height: 56px;

  .mid-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;

    .line {
      height: 100%;
      width: 2px;
      background-color: #ccc;
    }
  }

  .circle {
        height: 24px;
        width: 24px;
        min-width: 24px;
        max-width: 24px !important;
        min-height: 24px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        aspect-ratio: 1;
        padding: 0;
        border: 2px dotted #ccc;
    }

  .add-bracket {
    display: flex;
    align-items: center;
    width: fit-content;

    &:hover {
        .line, .circle {
            border-style: solid;
        }
    }
    
    .line {
        width: 8px;
        border-bottom: 2px dotted #ccc;
    }

  }
  .added-bracket {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: fit-content;
    height: 100%;

    .line {
        width: 2px;
        height: 100%;
        background-color: #ccc;
    }

    .circle {
        border-style: solid;
    }

  }
}
</style>
